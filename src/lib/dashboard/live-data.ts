import type {
  AiAuditLog,
  Call,
  Clinic,
  ClinicUser,
  DashboardMetricSnapshot,
  PatientLead,
  RecoveryWorkflow,
  SmsEvent,
} from "@/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardClinicContext = Pick<Clinic, "id" | "name" | "status" | "timezone">;

export type DashboardMetricCard = {
  change: string;
  label: string;
  tone: "positive" | "neutral" | "warning";
  value: string;
};

export type MissedCallRow = {
  id: string;
  leadLabel: string;
  receivedAt: string;
  recoveryState: string;
  smsStatus: string | null;
  sourceTable: "calls";
  waitingFor: string;
};

export type LeadPipelineColumn = {
  leads: Array<Pick<PatientLead, "id" | "lead_score" | "priority" | "source" | "status"> & { label: string; nextAction: string }>;
  status: PatientLead["status"];
  title: string;
};

export type WorkflowActivityItem = {
  description: string;
  id: string;
  state: string;
  timestamp: string;
  title: string;
};

export type ClinicDashboardData = {
  activity: WorkflowActivityItem[];
  clinic: DashboardClinicContext | null;
  error: string | null;
  leadColumns: LeadPipelineColumn[];
  metrics: DashboardMetricCard[];
  missedCalls: MissedCallRow[];
  snapshot: DashboardMetricSnapshot | null;
};

const leadStatuses: Array<PatientLead["status"]> = ["new", "contacted", "qualified", "booked"];

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatPounds(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    currency: "GBP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(pence / 100);
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function callRecoveryState(call: Call, workflow?: RecoveryWorkflow) {
  if (workflow) {
    return formatLabel(workflow.state);
  }

  return formatLabel(call.recovery_status);
}

function buildMetrics(snapshot: DashboardMetricSnapshot | null): DashboardMetricCard[] {
  return [
    {
      change: snapshot ? `Period ending ${snapshot.period_end}` : "No snapshot yet",
      label: "Missed calls",
      tone: snapshot && snapshot.missed_calls > 0 ? "warning" : "neutral",
      value: String(snapshot?.missed_calls ?? 0),
    },
    {
      change: snapshot ? `${snapshot.booked_leads} booked` : "No leads yet",
      label: "New leads",
      tone: "neutral",
      value: String(snapshot?.new_leads ?? 0),
    },
    {
      change: snapshot ? "Logged delivery events" : "No SMS events yet",
      label: "SMS sent",
      tone: "neutral",
      value: String(snapshot?.sms_sent ?? 0),
    },
    {
      change: snapshot ? "Recovered revenue" : "No recovery yet",
      label: "Recovered",
      tone: "positive",
      value: formatPounds(snapshot?.revenue_recovered_pence ?? 0),
    },
  ];
}

function buildMissedCallRows(calls: Call[], workflows: RecoveryWorkflow[], smsEvents: SmsEvent[]): MissedCallRow[] {
  return calls.map((call) => {
    const workflow = workflows.find((item) => item.call_id === call.id);
    const smsEvent = workflow ? smsEvents.find((event) => event.recovery_workflow_id === workflow.id) : null;

    return {
      id: call.id,
      leadLabel: `Call ${shortId(call.id)}`,
      receivedAt: formatDateTime(call.started_at),
      recoveryState: callRecoveryState(call, workflow),
      smsStatus: smsEvent ? formatLabel(smsEvent.status) : null,
      sourceTable: "calls",
      waitingFor: call.recovery_next_action ?? (workflow?.next_action_at ? "Scheduled follow-up" : "Workflow review"),
    };
  });
}

function buildLeadColumns(leads: PatientLead[]): LeadPipelineColumn[] {
  return leadStatuses.map((status) => ({
    leads: leads
      .filter((lead) => lead.status === status)
      .map((lead) => ({
        id: lead.id,
        label: `${formatLabel(lead.source)} lead ${shortId(lead.id)}`,
        lead_score: lead.lead_score,
        nextAction: lead.next_follow_up_at ? `Follow up ${formatDateTime(lead.next_follow_up_at)}` : `${formatLabel(lead.priority)} priority`,
        priority: lead.priority,
        source: lead.source,
        status: lead.status,
      })),
    status,
    title: formatLabel(status),
  }));
}

function buildActivity(workflows: RecoveryWorkflow[], auditEvents: AiAuditLog[]): WorkflowActivityItem[] {
  const workflowItems = workflows.map((workflow) => ({
    description: `${formatLabel(workflow.channel)} workflow step ${workflow.current_step} of ${workflow.max_steps}.`,
    id: workflow.id,
    state: formatLabel(workflow.state),
    timestamp: formatDateTime(workflow.updated_at),
    title: `Workflow ${shortId(workflow.id)}`,
  }));

  const auditItems = auditEvents.map((event) => ({
    description: `${formatLabel(event.model_provider)} action recorded with ${event.safety_status} safety status.`,
    id: event.id,
    state: formatLabel(event.safety_status),
    timestamp: formatDateTime(event.created_at),
    title: formatLabel(event.action),
  }));

  return [...workflowItems, ...auditItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

function emptyDashboard(error: string | null = null): ClinicDashboardData {
  return {
    activity: [],
    clinic: null,
    error,
    leadColumns: buildLeadColumns([]),
    metrics: buildMetrics(null),
    missedCalls: [],
    snapshot: null,
  };
}

export async function getClinicDashboardData(userId: string | null): Promise<ClinicDashboardData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !userId) {
    return emptyDashboard("Supabase is not configured for live dashboard data.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: membership, error: membershipError } = await supabase
    .from("clinic_users")
    .select("*")
    .eq("auth_user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ClinicUser>();

  if (membershipError) {
    return emptyDashboard("Could not load clinic membership.");
  }

  if (!membership) {
    return emptyDashboard("No active clinic membership found.");
  }

  const [
    { data: clinic, error: clinicError },
    { data: snapshot },
    { data: calls, error: callsError },
    { data: smsEvents, error: smsError },
    { data: leads, error: leadsError },
    { data: workflows, error: workflowsError },
    { data: auditEvents, error: auditError },
  ] = await Promise.all([
    supabase.from("clinics").select("id,name,status,timezone").eq("id", membership.clinic_id).maybeSingle<DashboardClinicContext>(),
    supabase
      .from("dashboard_metric_snapshots")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle<DashboardMetricSnapshot>(),
    supabase
      .from("calls")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("status", "missed")
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(8)
      .returns<Call[]>(),
    supabase
      .from("sms_events")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("occurred_at", { ascending: false })
      .limit(20)
      .returns<SmsEvent[]>(),
    supabase
      .from("patient_leads")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .in("status", leadStatuses)
      .order("updated_at", { ascending: false })
      .limit(30)
      .returns<PatientLead[]>(),
    supabase
      .from("recovery_workflows")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10)
      .returns<RecoveryWorkflow[]>(),
    supabase
      .from("ai_audit_logs")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<AiAuditLog[]>(),
  ]);

  const loadError = clinicError || callsError || smsError || leadsError || workflowsError || auditError;

  return {
    activity: buildActivity(workflows ?? [], auditEvents ?? []),
    clinic: clinic ?? null,
    error: loadError ? "Some dashboard data could not be loaded." : null,
    leadColumns: buildLeadColumns(leads ?? []),
    metrics: buildMetrics(snapshot ?? null),
    missedCalls: buildMissedCallRows(calls ?? [], workflows ?? [], smsEvents ?? []),
    snapshot: snapshot ?? null,
  };
}
