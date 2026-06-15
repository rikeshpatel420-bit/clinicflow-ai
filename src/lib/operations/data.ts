import type { AlertSeverity, SlaStatus } from "@/lib/operations/sla";
import { calculateHealthScore, getSeverity, getSlaStatus } from "@/lib/operations/sla";

export type LiveActivityEvent = {
  id: string;
  actor: string;
  event: string;
  area: "calls" | "patients" | "appointments" | "recovery" | "staff" | "system";
  status: "new" | "in_progress" | "resolved" | "escalated";
  createdAt: string;
};

export type OperationalAlert = {
  id: string;
  patient: string;
  title: string;
  source: string;
  severity: AlertSeverity;
  slaStatus: SlaStatus;
  minutesWaiting: number;
  valueAtRisk: number;
  owner: string;
  nextAction: string;
};

export type StaffWorkload = {
  name: string;
  role: string;
  activeTasks: number;
  unresolvedAlerts: number;
  capacity: number;
};

export type TaskQueueItem = {
  id: string;
  label: string;
  count: number;
  slaTarget: string;
  trend: string;
};

const rawAlerts = [
  {
    id: "alert-1",
    patient: "Amelia Carter",
    title: "High-value implant enquiry waiting for callback",
    source: "Missed call",
    minutesWaiting: 52,
    valueAtRisk: 950,
    owner: "Maya Shah",
    nextAction: "Call back before lunch and offer consultation slot.",
  },
  {
    id: "alert-2",
    patient: "Noah Williams",
    title: "New patient hygiene booking not confirmed",
    source: "Website lead",
    minutesWaiting: 28,
    valueAtRisk: 180,
    owner: "James Carter",
    nextAction: "Confirm preferred appointment window.",
  },
  {
    id: "alert-3",
    patient: "Sofia Khan",
    title: "Cancellation risk for tomorrow morning",
    source: "Appointment reminder",
    minutesWaiting: 17,
    valueAtRisk: 240,
    owner: "Priya Nair",
    nextAction: "Send staff-approved reassurance message.",
  },
  {
    id: "alert-4",
    patient: "Daniel Moore",
    title: "Unanswered recall reply",
    source: "Recall campaign",
    minutesWaiting: 8,
    valueAtRisk: 120,
    owner: "Reception pool",
    nextAction: "Triage after urgent callbacks are cleared.",
  },
];

const alerts: OperationalAlert[] = rawAlerts.map((alert) => ({
  ...alert,
  severity: getSeverity(alert.minutesWaiting, alert.valueAtRisk),
  slaStatus: getSlaStatus(alert.minutesWaiting, 30),
}));

const staff: StaffWorkload[] = [
  { name: "Maya Shah", role: "Admin", activeTasks: 9, unresolvedAlerts: 2, capacity: 82 },
  { name: "James Carter", role: "Reception", activeTasks: 6, unresolvedAlerts: 1, capacity: 64 },
  { name: "Priya Nair", role: "Clinician", activeTasks: 4, unresolvedAlerts: 1, capacity: 48 },
  { name: "Reception pool", role: "Shared queue", activeTasks: 11, unresolvedAlerts: 4, capacity: 91 },
];

const breachedCount = alerts.filter((alert) => alert.slaStatus === "breached").length;
const unresolvedCount = alerts.filter((alert) => alert.slaStatus !== "within_sla").length;

export const operationsDemo = {
  generatedAt: "Live simulated, 10:42",
  healthScore: calculateHealthScore({ breached: breachedCount, unresolved: unresolvedCount, workloadImbalance: 2 }),
  ticker: [
    { label: "Open alerts", value: String(alerts.length), trend: "+2 today" },
    { label: "SLA risk", value: String(unresolvedCount), trend: "needs action" },
    { label: "Callbacks due", value: "7", trend: "next 60 min" },
    { label: "Revenue at risk", value: "GBP 1,490", trend: "live estimate" },
  ],
  briefing: [
    "One implant enquiry is outside SLA and should be handled before routine recall work.",
    "Reception pool is at 91% capacity; move two low-priority tasks to admin.",
    "Tomorrow morning has three confirmation risks that may affect chair utilisation.",
  ],
  taskQueue: [
    { id: "queue-1", label: "Urgent callbacks", count: 4, slaTarget: "30 min", trend: "+1 in 15 min" },
    { id: "queue-2", label: "Unresolved patient replies", count: 9, slaTarget: "2 hours", trend: "stable" },
    { id: "queue-3", label: "Appointment risk checks", count: 3, slaTarget: "same day", trend: "-2 resolved" },
    { id: "queue-4", label: "Staff approval drafts", count: 12, slaTarget: "daily", trend: "+5 pending" },
  ] satisfies TaskQueueItem[],
  communicationStatus: [
    { channel: "SMS drafts", status: "Staff approval only", count: 12 },
    { channel: "Inbound replies", status: "Needs triage", count: 9 },
    { channel: "Calls queued", status: "Priority sorted", count: 7 },
    { channel: "Campaign checks", status: "Paused safely", count: 2 },
  ],
  alerts,
  staff,
  activity: [
    {
      id: "evt-1",
      actor: "Maya Shah",
      event: "escalated Amelia Carter to urgent callback",
      area: "recovery",
      status: "escalated",
      createdAt: "2 min ago",
    },
    {
      id: "evt-2",
      actor: "System",
      event: "flagged tomorrow hygiene appointment as at risk",
      area: "appointments",
      status: "new",
      createdAt: "7 min ago",
    },
    {
      id: "evt-3",
      actor: "James Carter",
      event: "resolved new patient booking question",
      area: "patients",
      status: "resolved",
      createdAt: "12 min ago",
    },
    {
      id: "evt-4",
      actor: "Reception pool",
      event: "accepted three callback tasks",
      area: "staff",
      status: "in_progress",
      createdAt: "18 min ago",
    },
  ] satisfies LiveActivityEvent[],
  conversionHeatmap: [
    { label: "Mon", value: 72 },
    { label: "Tue", value: 61 },
    { label: "Wed", value: 84 },
    { label: "Thu", value: 68 },
    { label: "Fri", value: 76 },
    { label: "Sat", value: 45 },
  ],
};

