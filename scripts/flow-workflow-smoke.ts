import assert from "node:assert/strict";
import {
  createWorkflowAction,
  createWorkflowCondition,
  createWorkflowDefinition,
  createWorkflowFallback,
  createWorkflowStep,
  runWorkflowEngine,
  type FlowWorkflowActionHandler,
  type FlowWorkflowActionType,
} from "../src/lib/flow-platform";

const actionHandlers: Partial<Record<FlowWorkflowActionType, FlowWorkflowActionHandler>> = {
  add_note: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Note stored.", label: action.label, ok: true }),
  assign_owner: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Owner assigned.", label: action.label, ok: true }),
  classify_intent: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Intent classified.", label: action.label, ok: true }),
  create_lead: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Lead created.", label: action.label, ok: true }),
  create_task: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Task created.", label: action.label, ok: true }),
  escalate: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Escalated to staff.", label: action.label, ok: true }),
  extract_entities: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Entities extracted.", label: action.label, ok: true }),
  mark_recovery_status: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Recovery stage updated.", label: action.label, ok: true }),
  notify_staff: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Staff notified.", label: action.label, ok: true }),
  schedule_callback: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Callback scheduled.", label: action.label, ok: true }),
  score_urgency: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Urgency scored.", label: action.label, ok: true }),
  send_email: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Email queued.", label: action.label, ok: true }),
  send_sms: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "SMS queued.", label: action.label, ok: true }),
  update_call_summary: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Summary updated.", label: action.label, ok: true }),
  update_dashboard: async ({ action }) => ({ actionId: action.id, actionType: action.type, detail: "Dashboard refreshed.", label: action.label, ok: true }),
};

async function main() {
  const clinicEmergencyProfile = {
    id: "clinicflow",
    workflows: [
      createWorkflowDefinition({
        actions: [
          createWorkflowAction("classify-intent", "classify_intent", "Classify intent", "Detect the caller's reason for calling."),
          createWorkflowAction("extract-entities", "extract_entities", "Extract entities", "Capture names, contact details, and symptoms."),
          createWorkflowAction("score-urgency", "score_urgency", "Score urgency", "Apply the emergency urgency rules."),
          createWorkflowAction("notify-staff", "notify_staff", "Notify staff", "Alert the reception team."),
          createWorkflowAction("escalate", "escalate", "Escalate", "Escalate to the human receptionist."),
        ],
        auditTrail: { enabled: true, entityTable: "audit_events", eventTypes: ["workflow.started", "workflow.completed", "workflow.failed"], note: "Clinic emergency workflow.", riskLevel: "high" },
        channel: "workflow",
        conditions: [createWorkflowCondition("intent", "equals", "dental_emergency", "Intent")],
        description: "Dental emergency triage and escalation.",
        fallback: createWorkflowFallback("Fallback", "Escalate if the emergency flow cannot continue.", ["escalate", "notify_staff"]),
        handler: "handleTwilioVoiceWebhook",
        key: "dental-emergency-workflow",
        label: "Dental emergency workflow",
        profileId: "clinicflow",
        steps: [
          createWorkflowStep("clinic-emergency-1", "Triage", "Classify the call and capture the key details.", ["classify-intent", "extract-entities"]),
          createWorkflowStep("clinic-emergency-2", "Urgency", "Score urgency and notify the team.", ["score-urgency", "notify-staff"], { fallbackActionIds: ["escalate"] }),
          createWorkflowStep("clinic-emergency-3", "Escalate", "Escalate immediately when required.", ["escalate"], { continueOnError: true }),
        ],
        status: "active",
        trigger: "emergency_detected",
      }),
    ],
  };

  const plumbLeakProfile = {
    id: "plumbflow",
    workflows: [
      createWorkflowDefinition({
        actions: [
          createWorkflowAction("classify-intent", "classify_intent", "Classify intent", "Detect the caller's reason for calling."),
          createWorkflowAction("extract-entities", "extract_entities", "Extract entities", "Capture address, postcode, and access notes."),
          createWorkflowAction("create-task", "create_task", "Create task", "Create the plumbing follow-up task."),
          createWorkflowAction("send-sms", "send_sms", "Send SMS", "Send the plumbing recovery SMS."),
          createWorkflowAction("notify-staff", "notify_staff", "Notify staff", "Alert the operations team."),
        ],
        auditTrail: { enabled: true, entityTable: "audit_events", eventTypes: ["workflow.started", "workflow.completed", "workflow.failed"], note: "PlumbFlow leak workflow.", riskLevel: "high" },
        channel: "workflow",
        conditions: [createWorkflowCondition("intent", "equals", "emergency_leak", "Intent")],
        description: "Emergency leak triage and recovery.",
        fallback: createWorkflowFallback("Fallback", "Notify the team if the leak flow cannot continue.", ["notify_staff"]),
        handler: "handlePlumbFlowVoiceWebhook",
        key: "emergency-leak-workflow",
        label: "Emergency leak workflow",
        profileId: "plumbflow",
        steps: [
          createWorkflowStep("plumb-leak-1", "Triage", "Classify the leak and capture the issue.", ["classify-intent", "extract-entities"]),
          createWorkflowStep("plumb-leak-2", "Recover", "Create the follow-up task and send the SMS.", ["create-task", "send-sms"], { fallbackActionIds: ["notify-staff"] }),
        ],
        status: "active",
        trigger: "emergency_detected",
      }),
    ],
  };

  const fallbackProfile = {
    id: "clinicflow",
    workflows: [
      createWorkflowDefinition({
        actions: [createWorkflowAction("notify-staff", "notify_staff", "Notify staff", "Alert the reception team.")],
        auditTrail: { enabled: true, entityTable: "audit_events", eventTypes: ["workflow.started", "workflow.completed", "workflow.failed"], note: "Fallback workflow.", riskLevel: "medium" },
        channel: "workflow",
        description: "Fallback workflow for unmatched events.",
        fallback: createWorkflowFallback("Fallback", "Keep the caller safe and transfer to staff.", ["notify-staff"]),
        handler: "handleTwilioVoiceWebhook",
        key: "fallback-workflow",
        label: "Fallback workflow",
        profileId: "clinicflow",
        status: "active",
        trigger: "payment_due",
      }),
    ],
  };

  const failingProfile = {
    id: "clinicflow",
    workflows: [
      createWorkflowDefinition({
        actions: [createWorkflowAction("send-sms", "send_sms", "Send SMS", "Send a summary SMS.")],
        channel: "workflow",
        description: "Failure path workflow.",
        handler: "handleTwilioVoiceWebhook",
        key: "failing-workflow",
        label: "Failing workflow",
        profileId: "clinicflow",
        status: "active",
        trigger: "follow_up_due",
        steps: [
          createWorkflowStep("failing-step", "Send SMS", "This should fail safely.", ["send-sms"]),
        ],
      }),
    ],
  };

  const emergencyResult = await runWorkflowEngine(clinicEmergencyProfile, {
    businessHours: true,
    intent: "dental_emergency",
    payload: { intent: "dental_emergency", urgency: 95 },
    profileId: "clinicflow",
    trigger: "emergency_detected",
    urgency: 95,
  }, { actionHandlers });

  assert.equal(emergencyResult.matchedWorkflows, 1);
  assert.equal(emergencyResult.executions[0]?.status, "completed");
  assert.equal(emergencyResult.fallbackApplied, false);

  const plumbResult = await runWorkflowEngine(plumbLeakProfile, {
    intent: "emergency_leak",
    payload: { intent: "emergency_leak", postcode: "SW1A 1AA" },
    profileId: "plumbflow",
    trigger: "emergency_detected",
  }, { actionHandlers });

  assert.equal(plumbResult.matchedWorkflows, 1);
  assert.equal(plumbResult.executions[0]?.status, "completed");

  const fallbackResult = await runWorkflowEngine(fallbackProfile, {
    profileId: "clinicflow",
    trigger: "review_request_due",
  }, { actionHandlers });

  assert.equal(fallbackResult.fallbackApplied, true);
  assert.equal(fallbackResult.matchedWorkflows, 0);

  const failingResult = await runWorkflowEngine(failingProfile, {
    profileId: "clinicflow",
    trigger: "follow_up_due",
  }, {
    actionHandlers: {
      send_sms: async () => {
        throw new Error("Simulated SMS failure");
      },
    },
  });

  assert.equal(failingResult.matchedWorkflows, 1);
  assert.equal(failingResult.executions[0]?.status, "failed");

  console.log("Flow Workflow engine smoke check passed");
  console.log(`Emergency workflow: ${emergencyResult.executions[0]?.workflowKey} -> ${emergencyResult.executions[0]?.status}`);
  console.log(`PlumbFlow workflow: ${plumbResult.executions[0]?.workflowKey} -> ${plumbResult.executions[0]?.status}`);
  console.log(`Fallback applied: ${fallbackResult.fallbackApplied}`);
  console.log(`Failure handled safely: ${failingResult.executions[0]?.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
