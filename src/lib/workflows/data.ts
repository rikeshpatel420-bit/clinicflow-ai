export type WorkflowStage = "draft" | "active" | "paused" | "error";
export type AutomationState = "idle" | "queued" | "running" | "waiting" | "completed" | "failed" | "escalated";

export type WorkflowNode = {
  id: string;
  label: string;
  kind: "trigger" | "condition" | "action" | "delay" | "escalation";
  detail: string;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  status: WorkflowStage;
  objective: string;
  nodes: WorkflowNode[];
  successRate: string;
};

export type AutomationRun = {
  id: string;
  workflowName: string;
  state: AutomationState;
  leadScore: number;
  conversionProbability: number;
  retryCount: number;
  nextStep: string;
};

export type WorkflowEvent = {
  id: string;
  event: string;
  entity: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
};

export type ClinicNotification = {
  id: string;
  title: string;
  body: string;
  priority: "low" | "normal" | "high";
  status: "unread" | "read";
};

const now = new Date().toISOString();

export const workflowDemo = {
  auditLogs: [
    { id: "audit-1", event: "Lead score recalculated", entity: "Amelia Carter", severity: "info", createdAt: now },
    { id: "audit-2", event: "Escalation rule matched", entity: "Missed call recovery", severity: "warning", createdAt: now },
    { id: "audit-3", event: "Campaign scheduler evaluated", entity: "Hygiene recall draft", severity: "info", createdAt: now },
  ] satisfies WorkflowEvent[],
  automations: [
    {
      id: "auto-1",
      workflowName: "Missed call recovery",
      state: "waiting",
      leadScore: 92,
      conversionProbability: 74,
      retryCount: 1,
      nextStep: "Wait 20 minutes, then escalate to reception lead.",
    },
    {
      id: "auto-2",
      workflowName: "Recall campaign follow-up",
      state: "queued",
      leadScore: 68,
      conversionProbability: 41,
      retryCount: 0,
      nextStep: "Queue staff-approved SMS draft.",
    },
  ] satisfies AutomationRun[],
  metrics: [
    { label: "Automation success", value: "71%", note: "demo completion rate" },
    { label: "Avg lead score", value: "80", note: "missed-call priority" },
    { label: "Escalations", value: "3", note: "needs staff review" },
    { label: "Retries queued", value: "5", note: "safe test mode" },
  ],
  notifications: [
    {
      id: "note-1",
      title: "High-value missed call needs review",
      body: "Priority 92 lead has an estimated GBP 350 booking value.",
      priority: "high",
      status: "unread",
    },
    {
      id: "note-2",
      title: "Campaign scheduler paused",
      body: "Hygiene recall draft is waiting for approval before sending.",
      priority: "normal",
      status: "unread",
    },
  ] satisfies ClinicNotification[],
  scheduler: [
    { label: "08:30", action: "Evaluate overnight missed calls" },
    { label: "12:00", action: "Review unbooked replied leads" },
    { label: "17:30", action: "Prepare next-day recall drafts" },
  ],
  workflows: [
    {
      id: "workflow-1",
      name: "Missed call recovery",
      status: "active",
      objective: "Convert missed high-intent calls into booked appointments.",
      successRate: "74%",
      nodes: [
        { id: "n1", label: "Missed call detected", kind: "trigger", detail: "Call status enters missed stage." },
        { id: "n2", label: "Lead score", kind: "condition", detail: "Score by source, value, and recency." },
        { id: "n3", label: "Draft follow-up", kind: "action", detail: "Create staff-approved SMS draft." },
        { id: "n4", label: "Escalate", kind: "escalation", detail: "Notify reception lead if no reply." },
      ],
    },
    {
      id: "workflow-2",
      name: "Recall campaign sequence",
      status: "draft",
      objective: "Win repeat bookings from dormant patient lists.",
      successRate: "41%",
      nodes: [
        { id: "r1", label: "Audience selected", kind: "trigger", detail: "Inactive patient segment." },
        { id: "r2", label: "Schedule window", kind: "delay", detail: "Send only during clinic hours." },
        { id: "r3", label: "Staff approval", kind: "condition", detail: "No automation executes without approval." },
      ],
    },
  ] satisfies WorkflowDefinition[],
};
