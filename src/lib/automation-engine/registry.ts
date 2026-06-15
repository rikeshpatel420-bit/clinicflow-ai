import type { RuleActionKey, RuleTriggerKey } from "@/lib/automation-engine/types";

export const triggerRegistry: Record<RuleTriggerKey, { label: string; description: string }> = {
  campaign_reply: { label: "Campaign reply", description: "Patient replies to an approved reactivation campaign." },
  inactive_patient: { label: "Inactive patient", description: "Patient has not booked within the configured retention window." },
  lifecycle_stage_changed: { label: "Lifecycle stage changed", description: "Patient moves through enquiry, booking, treatment, or recall stages." },
  missed_call: { label: "Missed call", description: "Inbound call is marked missed and needs safe recovery handling." },
  sla_breach: { label: "SLA breach", description: "A callback or response task exceeds the configured clinic SLA." },
};

export const actionRegistry: Record<RuleActionKey, { label: string; description: string }> = {
  create_task: { label: "Create task", description: "Assign a front-desk or manager task with priority and due time." },
  draft_notification: { label: "Draft notification", description: "Prepare an internal or staff-approved patient communication." },
  record_audit_event: { label: "Record audit event", description: "Write an audit-safe execution event for governance review." },
  route_escalation: { label: "Route escalation", description: "Escalate urgent or high-value work to the configured owner." },
  schedule_follow_up: { label: "Schedule follow-up", description: "Queue a deterministic follow-up job for later review." },
};

