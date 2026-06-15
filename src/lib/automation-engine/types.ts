export type RuleTriggerKey = "missed_call" | "sla_breach" | "inactive_patient" | "lifecycle_stage_changed" | "campaign_reply";
export type RuleActionKey = "create_task" | "route_escalation" | "draft_notification" | "schedule_follow_up" | "record_audit_event";
export type ExecutionState = "pending" | "running" | "waiting" | "completed" | "failed" | "retrying" | "escalated";

export type AutomationRule = {
  id: string;
  name: string;
  trigger: RuleTriggerKey;
  actions: RuleActionKey[];
  enabled: boolean;
  priority: number;
};

export type AutomationRun = {
  id: string;
  ruleId: string;
  state: ExecutionState;
  patientLabel: string;
  attempts: number;
  maxAttempts: number;
  startedAt: string;
  nextStep: string;
};

