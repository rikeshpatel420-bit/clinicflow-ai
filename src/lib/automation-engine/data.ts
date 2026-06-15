import type { AutomationRule, AutomationRun } from "@/lib/automation-engine/types";
import { nextBackoffMinutes, shouldRetryRun } from "@/lib/automation-engine/execution";

export const automationEngineDemo = {
  rules: [
    {
      id: "rule-1",
      name: "High-value missed call recovery",
      trigger: "missed_call",
      actions: ["create_task", "draft_notification", "record_audit_event"],
      enabled: true,
      priority: 80,
    },
    {
      id: "rule-2",
      name: "SLA breach escalation",
      trigger: "sla_breach",
      actions: ["route_escalation", "record_audit_event"],
      enabled: true,
      priority: 70,
    },
    {
      id: "rule-3",
      name: "Inactive patient reactivation",
      trigger: "inactive_patient",
      actions: ["schedule_follow_up", "draft_notification", "record_audit_event"],
      enabled: true,
      priority: 45,
    },
  ] satisfies AutomationRule[],
  runs: [
    {
      id: "run-1",
      ruleId: "rule-1",
      state: "completed",
      patientLabel: "Demo lead A",
      attempts: 1,
      maxAttempts: 3,
      startedAt: "Today 09:20",
      nextStep: "Task created and internal notification drafted.",
    },
    {
      id: "run-2",
      ruleId: "rule-2",
      state: "escalated",
      patientLabel: "Demo lead B",
      attempts: 1,
      maxAttempts: 3,
      startedAt: "Today 09:48",
      nextStep: "Escalated to practice manager for SLA breach.",
    },
    {
      id: "run-3",
      ruleId: "rule-3",
      state: "retrying",
      patientLabel: "Demo recall cohort",
      attempts: 2,
      maxAttempts: 3,
      startedAt: "Today 10:05",
      nextStep: `Retry in ${nextBackoffMinutes(2)} minutes.`,
    },
  ] satisfies AutomationRun[],
  timeline: [
    { id: "tl-1", label: "Trigger received", detail: "missed_call matched rule-1", time: "09:20" },
    { id: "tl-2", label: "Actions planned", detail: "create_task, draft_notification, record_audit_event", time: "09:20" },
    { id: "tl-3", label: "Audit recorded", detail: "Execution event stored in demo audit trail.", time: "09:21" },
    { id: "tl-4", label: "Retry scheduled", detail: "Inactive patient reactivation queued with safe backoff.", time: "10:05" },
  ],
  metrics: [
    { label: "Rules active", value: "3", note: "demo engine" },
    { label: "Runs today", value: "18", note: "simulated" },
    { label: "Escalations", value: "4", note: "SLA and value based" },
    { label: "Retry queue", value: "1", note: shouldRetryRun({
      attempts: 2,
      id: "demo",
      maxAttempts: 3,
      nextStep: "",
      patientLabel: "",
      ruleId: "",
      startedAt: "",
      state: "retrying",
    }) ? "safe backoff" : "clear" },
  ],
};
