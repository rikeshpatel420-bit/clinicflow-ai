import type { User } from "@supabase/supabase-js";
import type {
  Call,
  Clinic,
  DashboardMetricSnapshot,
  PatientLead,
  RecoveryWorkflow,
  SmsEvent,
} from "@/types/database";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
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

type LiveMetricTotals = {
  bookedLeads: number;
  recoveredLeads: number;
  smsReplied: number;
  smsSent: number;
  totalCalls: number;
  missedCalls: number;
  newLeads: number;
  revenueRecoveredPence: number;
  recoveredCalls: number;
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

const leadStatuses: Array<PatientLead["status"]> = ["new", "contacted", "qualified", "recovered", "booked", "lost", "opted_out"];

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

function buildMetrics(snapshot: DashboardMetricSnapshot | null, liveTotals?: LiveMetricTotals): DashboardMetricCard[] {
  const totalCalls = liveTotals?.totalCalls ?? 0;
  const missedCalls = snapshot?.missed_calls ?? liveTotals?.missedCalls ?? 0;
  const smsSent = snapshot?.sms_sent ?? liveTotals?.smsSent ?? 0;
  const smsReplied = liveTotals?.smsReplied ?? 0;
  const recoveredLeads = liveTotals?.recoveredLeads ?? 0;
  const recoveryRate = missedCalls > 0 ? Math.round((recoveredLeads / missedCalls) * 100) : 0;

  return [
    {
      change: snapshot ? `Period ending ${snapshot.period_end}` : "Live clinic total",
      label: "Total calls",
      tone: totalCalls > 0 ? "neutral" : "warning",
      value: String(totalCalls),
    },
    {
      change: snapshot ? `${missedCalls} missed` : "Live clinic total",
      label: "Missed calls",
      tone: missedCalls > 0 ? "warning" : "neutral",
      value: String(missedCalls),
    },
    {
      change: snapshot ? `${smsSent} sent` : "Live SMS throughput",
      label: "SMS sent",
      tone: smsSent > 0 ? "neutral" : "warning",
      value: String(smsSent),
    },
    {
      change: smsReplied > 0 ? `${smsReplied} replies` : "Live reply tracking",
      label: "SMS replied",
      tone: smsReplied > 0 ? "positive" : "neutral",
      value: String(smsReplied),
    },
    {
      change: `${recoveredLeads} recovered`,
      label: "Recovered leads",
      tone: recoveredLeads > 0 ? "positive" : "neutral",
      value: String(recoveredLeads),
    },
    {
      change: `${recoveryRate}% of missed`,
      label: "Recovery %",
      tone: recoveryRate > 0 ? "positive" : "neutral",
      value: `${recoveryRate}%`,
    },
  ];
}

function buildMissedCallRows(calls: Call[], workflows: RecoveryWorkflow[], smsEvents: SmsEvent[]): MissedCallRow[] {
  return calls.filter((call) => ["missed", "voicemail", "abandoned"].includes(call.status)).map((call) => {
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
        nextAction:
          lead.status === "recovered"
            ? "Call back and confirm the next step."
            : lead.status === "opted_out"
              ? "Respect the opt-out and close the thread."
              : lead.next_follow_up_at
                ? `Follow up ${formatDateTime(lead.next_follow_up_at)}`
                : `${formatLabel(lead.priority)} priority`,
        priority: lead.priority,
        source: lead.source,
        status: lead.status,
      })),
    status,
    title: formatLabel(status),
  }));
}

function buildActivity(workflows: RecoveryWorkflow[]): WorkflowActivityItem[] {
  return workflows
    .map((workflow) => ({
      description: `${formatLabel(workflow.channel)} workflow step ${workflow.current_step} of ${workflow.max_steps}.`,
      id: workflow.id,
      state: formatLabel(workflow.state),
      timestamp: formatDateTime(workflow.updated_at),
      title: `Workflow ${shortId(workflow.id)}`,
    }))
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

export async function getClinicDashboardData(user: Pick<User, "email" | "id" | "user_metadata"> | null): Promise<ClinicDashboardData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return emptyDashboard("Supabase is not configured for live dashboard data.");
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return emptyDashboard("No active clinic membership found.");
  }

  const [
    { data: clinic, error: clinicError },
    { data: snapshot },
    { count: totalCallsCount, error: totalCallsError },
    { count: missedCallsCount, error: missedCallsCountError },
    { count: recoveredCallsCount, error: recoveredCallsCountError },
    { data: calls, error: callsError },
    { data: smsEvents, error: smsError },
    { data: leads, error: leadsError },
    { data: workflows, error: workflowsError },
  ] = await Promise.all([
    supabase.from("clinics").select("id,name,status,timezone").eq("id", membership.clinic_id).maybeSingle<DashboardClinicContext>(),
    supabase
      .from("dashboard_metric_snapshots")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle<DashboardMetricSnapshot>(),
    supabase.from("calls").select("id", { count: "exact", head: true }).eq("clinic_id", membership.clinic_id).is("deleted_at", null),
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .in("status", ["missed", "voicemail", "abandoned"]),
    supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .eq("status", "recovered"),
    supabase
      .from("calls")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(50)
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
  ]);

  const loadError = clinicError || totalCallsError || missedCallsCountError || recoveredCallsCountError || callsError || smsError || leadsError || workflowsError;
  const totalCalls = totalCallsCount ?? (calls ?? []).length;
  const missedCalls = missedCallsCount ?? (calls ?? []).filter((call) => ["missed", "voicemail", "abandoned"].includes(call.status)).length;
  const recoveredCalls = recoveredCallsCount ?? (calls ?? []).filter((call) => call.status === "recovered").length;
  const smsSent = (smsEvents ?? []).filter((event) => event.direction === "outbound" && ["queued", "sent", "delivered"].includes(event.status)).length;
  const smsReplied = (smsEvents ?? []).filter((event) => event.direction === "inbound" && event.recovery_workflow_id !== null).length;
  const liveTotals: LiveMetricTotals = {
    bookedLeads: (leads ?? []).filter((lead) => lead.status === "booked" || lead.status === "won").length,
    recoveredLeads: (leads ?? []).filter((lead) => lead.status === "recovered").length,
    smsReplied,
    smsSent,
    missedCalls,
    recoveredCalls,
    totalCalls,
    newLeads: (leads ?? []).length,
    revenueRecoveredPence: (leads ?? [])
      .filter((lead) => lead.status === "booked" || lead.status === "won")
      .reduce((total, lead) => total + (lead.estimated_value_pence ?? 0), 0),
  };

  return {
    activity: buildActivity(workflows ?? []),
    clinic: clinic ?? null,
    error: loadError ? "Some dashboard data could not be loaded." : null,
    leadColumns: buildLeadColumns(leads ?? []),
    metrics: buildMetrics(snapshot ?? null, liveTotals),
    missedCalls: buildMissedCallRows(calls ?? [], workflows ?? [], smsEvents ?? []),
    snapshot: snapshot ?? null,
  };
}
