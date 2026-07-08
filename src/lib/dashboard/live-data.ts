import type { User } from "@supabase/supabase-js";
import type {
  Appointment,
  BookingRequest,
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
import { isMissingRelationError } from "@/lib/twilio/db-write";

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

export type BookingRequestRow = Pick<
  BookingRequest,
  "booking_type" | "call_id" | "confirmation_reference" | "id" | "lead_id" | "next_step" | "notes" | "patient_id" | "preferred_time" | "requested_at" | "status"
>;

export type AppointmentRow = Pick<
  Appointment,
  | "appointment_end"
  | "appointment_start"
  | "booking_request_id"
  | "call_id"
  | "confirmation_reference"
  | "created_at"
  | "id"
  | "lead_id"
  | "notes"
  | "patient_email"
  | "patient_name"
  | "patient_phone"
  | "source"
  | "status"
  | "treatment_type"
  | "updated_at"
>;

type LiveMetricTotals = {
  aiHandledPercent: number;
  averageCallDurationSeconds: number;
  bookingRequests: number;
  bookedLeads: number;
  cancelledAppointments: number;
  confirmedAppointments: number;
  recoveredLeads: number;
  rescheduledAppointments: number;
  revenueRecoveredPence: number;
  smsReplied: number;
  smsSent: number;
  todaysAppointments: number;
  totalCalls: number;
  missedCalls: number;
  newLeads: number;
  upcomingAppointments: number;
  recoveredCalls: number;
};

export type ClinicDashboardData = {
  activity: WorkflowActivityItem[];
  appointments: AppointmentRow[];
  bookingRequests: BookingRequestRow[];
  businessSummary: {
    aiHandledPercent: number;
    bookings: number;
    callsToday: number;
    missedCalls: number;
    outstandingTasks: number;
    revenueEstimatePence: number;
    unreadEnquiries: number;
  };
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
  const bookingRequests = liveTotals?.bookingRequests ?? 0;
  const recoveredLeads = liveTotals?.recoveredLeads ?? 0;
  const bookingsConverted = liveTotals?.confirmedAppointments ?? Math.max(liveTotals?.bookedLeads ?? 0, 0);
  const recoveryRate = missedCalls > 0 ? Math.round(((liveTotals?.recoveredCalls ?? recoveredLeads) / missedCalls) * 100) : 0;

  return [
    {
      change: "Confirmed today",
      label: "Today's appointments",
      tone: (liveTotals?.todaysAppointments ?? 0) > 0 ? "positive" : "neutral",
      value: String(liveTotals?.todaysAppointments ?? 0),
    },
    {
      change: "Confirmed future diary",
      label: "Upcoming",
      tone: (liveTotals?.upcomingAppointments ?? 0) > 0 ? "positive" : "neutral",
      value: String(liveTotals?.upcomingAppointments ?? 0),
    },
    {
      change: "Cancelled appointments",
      label: "Cancelled",
      tone: (liveTotals?.cancelledAppointments ?? 0) > 0 ? "warning" : "neutral",
      value: String(liveTotals?.cancelledAppointments ?? 0),
    },
    {
      change: "Needs a new slot",
      label: "Rescheduled",
      tone: (liveTotals?.rescheduledAppointments ?? 0) > 0 ? "warning" : "neutral",
      value: String(liveTotals?.rescheduledAppointments ?? 0),
    },
    {
      change: "Booked lead value",
      label: "Revenue",
      tone: (liveTotals?.revenueRecoveredPence ?? 0) > 0 ? "positive" : "neutral",
      value: `£${Math.round((liveTotals?.revenueRecoveredPence ?? 0) / 100).toLocaleString("en-GB")}`,
    },
    {
      change: totalCalls > 0 ? "Across completed calls" : "Awaiting live calls",
      label: "Average call duration",
      tone: (liveTotals?.averageCallDurationSeconds ?? 0) > 0 ? "neutral" : "warning",
      value: `${liveTotals?.averageCallDurationSeconds ?? 0}s`,
    },
    {
      change: bookingRequests > 0 ? `${bookingRequests} total requests` : "No requests yet",
      label: "Bookings converted",
      tone: bookingsConverted > 0 ? "positive" : "neutral",
      value: String(bookingsConverted),
    },
    {
      change: `${recoveryRate}% of missed calls`,
      label: "Missed call recovery",
      tone: recoveryRate > 0 ? "positive" : "neutral",
      value: `${recoveryRate}%`,
    },
    {
      change: totalCalls > 0 ? "AI answered or recovered" : "Awaiting live calls",
      label: "AI confidence",
      tone: (liveTotals?.aiHandledPercent ?? 0) >= 70 ? "positive" : "neutral",
      value: `${liveTotals?.aiHandledPercent ?? 0}%`,
    },
    {
      change: snapshot ? `Period ending ${snapshot.period_end}` : "Live SMS throughput",
      label: "SMS sent",
      tone: smsSent > 0 ? "neutral" : "warning",
      value: String(smsSent),
    },
  ];
}

function isToday(value: string) {
  const today = new Date();
  const date = new Date(value);

  return (
    today.getUTCFullYear() === date.getUTCFullYear() &&
    today.getUTCMonth() === date.getUTCMonth() &&
    today.getUTCDate() === date.getUTCDate()
  );
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
    appointments: [],
    bookingRequests: [],
    businessSummary: {
      aiHandledPercent: 0,
      bookings: 0,
      callsToday: 0,
      missedCalls: 0,
      outstandingTasks: 0,
      revenueEstimatePence: 0,
      unreadEnquiries: 0,
    },
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
    { data: appointments, error: appointmentsError },
    { count: totalCallsCount, error: totalCallsError },
    { count: missedCallsCount, error: missedCallsCountError },
    { count: recoveredCallsCount, error: recoveredCallsCountError },
    { data: calls, error: callsError },
    { data: smsEvents, error: smsError },
    { data: leads, error: leadsError },
    { data: workflows, error: workflowsError },
    { data: bookingRequests, error: bookingRequestsError },
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
      .from("appointments")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("appointment_start", { ascending: false })
      .limit(24)
      .returns<AppointmentRow[]>(),
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
    supabase
      .from("booking_requests")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("requested_at", { ascending: false })
      .limit(12)
      .returns<BookingRequestRow[]>(),
  ]);

  const bookingRequestsLoadError = bookingRequestsError && !isMissingRelationError(bookingRequestsError) ? bookingRequestsError : null;
  const appointmentsLoadError = appointmentsError && !isMissingRelationError(appointmentsError) ? appointmentsError : null;
  const loadError =
    clinicError ||
    totalCallsError ||
    missedCallsCountError ||
    recoveredCallsCountError ||
    callsError ||
    smsError ||
    leadsError ||
    workflowsError ||
    bookingRequestsLoadError ||
    appointmentsLoadError;
  const totalCalls = totalCallsCount ?? (calls ?? []).length;
  const missedCalls = missedCallsCount ?? (calls ?? []).filter((call) => ["missed", "voicemail", "abandoned"].includes(call.status)).length;
  const recoveredCalls = recoveredCallsCount ?? (calls ?? []).filter((call) => call.status === "recovered").length;
  const confirmedAppointments = (appointments ?? []).filter((appointment) => appointment.status === "confirmed").length;
  const todaysAppointments = (appointments ?? []).filter((appointment) => appointment.status === "confirmed" && isToday(appointment.appointment_start)).length;
  const upcomingAppointments = (appointments ?? []).filter((appointment) => appointment.status === "confirmed" && appointment.appointment_start > new Date().toISOString()).length;
  const cancelledAppointments = (appointments ?? []).filter((appointment) => appointment.status === "cancelled").length;
  const rescheduledAppointments = (appointments ?? []).filter((appointment) => appointment.status === "reschedule_needed").length;
  const bookingRequestCount = (bookingRequests ?? []).filter((request) => ["requested", "confirmed"].includes(request.status)).length;
  const smsSent = (smsEvents ?? []).filter((event) => event.direction === "outbound" && ["queued", "sent", "delivered"].includes(event.status)).length;
  const smsReplied = (smsEvents ?? []).filter((event) => event.direction === "inbound" && event.recovery_workflow_id !== null).length;
  const completedDurations = (calls ?? []).map((call) => call.duration_seconds).filter((value): value is number => typeof value === "number" && value > 0);
  const averageCallDurationSeconds = completedDurations.length
    ? Math.round(completedDurations.reduce((total, value) => total + value, 0) / completedDurations.length)
    : 0;
  const callsToday = (calls ?? []).filter((call) => isToday(call.started_at)).length;
  const aiHandledPercent = totalCalls > 0 ? Math.round(((totalCalls - missedCalls) / totalCalls) * 100) : 0;
  const liveTotals: LiveMetricTotals = {
    aiHandledPercent,
    averageCallDurationSeconds,
    bookingRequests: bookingRequestCount,
    bookedLeads: Math.max(confirmedAppointments, (leads ?? []).filter((lead) => lead.status === "booked" || lead.status === "won").length),
    cancelledAppointments,
    confirmedAppointments,
    recoveredLeads: (leads ?? []).filter((lead) => lead.status === "recovered").length,
    rescheduledAppointments,
    smsReplied,
    smsSent,
    todaysAppointments,
    missedCalls,
    recoveredCalls,
    totalCalls,
    newLeads: (leads ?? []).length,
    upcomingAppointments,
    revenueRecoveredPence: (leads ?? [])
      .filter((lead) => lead.status === "booked" || lead.status === "won")
      .reduce((total, lead) => total + (lead.estimated_value_pence ?? 0), 0),
  };
  const unreadEnquiries = (leads ?? []).filter((lead) => lead.status === "new" || lead.status === "contacted").length;
  const outstandingTasks = (workflows ?? []).filter((workflow) =>
    ["queued", "waiting", "message_queued", "awaiting_patient_reply"].includes(workflow.state),
  ).length;

  return {
    activity: buildActivity(workflows ?? []),
    bookingRequests: bookingRequests ?? [],
    businessSummary: {
      aiHandledPercent,
      bookings: Math.max(confirmedAppointments, liveTotals.bookedLeads),
      callsToday,
      missedCalls,
      outstandingTasks,
      revenueEstimatePence: liveTotals.revenueRecoveredPence || (leads ?? []).reduce((total, lead) => total + (lead.estimated_value_pence ?? 0), 0),
      unreadEnquiries,
    },
    clinic: clinic ?? null,
    error: loadError ? "Some dashboard data could not be loaded." : null,
    appointments: appointments ?? [],
    leadColumns: buildLeadColumns(leads ?? []),
    metrics: buildMetrics(snapshot ?? null, liveTotals),
    missedCalls: buildMissedCallRows(calls ?? [], workflows ?? [], smsEvents ?? []),
    snapshot: snapshot ?? null,
  };
}
