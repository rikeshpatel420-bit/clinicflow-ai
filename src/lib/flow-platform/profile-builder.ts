import { defineFlowPlatformProfile } from "./factory";
import type {
  FlowWorkflowAction,
  FlowWorkflowActionType,
  FlowWorkflowAuditTrail,
  FlowWorkflowCondition,
  FlowWorkflowConditionOperator,
  FlowEntityDefinition,
  FlowKnowledgeBase,
  FlowMessageTemplates,
  FlowPlatformProfile,
  FlowWorkflowDefinition,
  FlowWorkflowFallback,
  FlowWorkflowStep,
  FlowSummaryTemplates,
} from "./types";

export type StandardContactVoiceEntity = "address" | "email" | "fullName" | "phoneNumber" | "postcode" | "preferredVisitTime";
export type StandardContactLeadEntity = "address" | "email" | "fullName" | "phone" | "postcode" | "preferredVisitTime";

export function createFlowPlatformProfile<
  TVoiceIntent extends string,
  TVoiceEntity extends string,
  TTreatmentIntent extends string,
  TLeadIntent extends string,
  TLeadEntity extends string = never,
>(profile: FlowPlatformProfile<TVoiceIntent, TVoiceEntity, TTreatmentIntent, TLeadIntent, TLeadEntity>) {
  return defineFlowPlatformProfile(profile);
}

export function createStandardContactVoiceEntities(): readonly FlowEntityDefinition<StandardContactVoiceEntity>[] {
  return [
    {
      entity: "fullName",
      label: "Full name",
      patterns: [/(?:my name is|i am|this is)\s+([a-z]+(?:\s+[a-z]+){0,3})/i, /name\s+(?:is|'s)?\s*([a-z]+(?:\s+[a-z]+){0,3})/i],
      normalize: (value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
    {
      entity: "phoneNumber",
      label: "Phone number",
      patterns: [/(?:\+44\s?7\d{3}[\s-]?\d{3}[\s-]?\d{3}|07\d{3}[\s-]?\d{3}[\s-]?\d{3})/i],
      normalize: (value) => value.replace(/\s+/g, " ").trim(),
    },
    {
      entity: "email",
      label: "Email",
      patterns: [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      normalize: (value) => value.toLowerCase(),
    },
    {
      entity: "postcode",
      label: "Postcode",
      patterns: [/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i],
      normalize: (value) => value.toUpperCase().replace(/\s+/g, " ").trim(),
    },
    {
      entity: "address",
      label: "Address",
      patterns: [/(?:address is|at)\s+(.+)/i],
    },
    {
      entity: "preferredVisitTime",
      label: "Preferred visit time",
      patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
    },
  ];
}

export function createStandardContactLeadEntities(): readonly FlowEntityDefinition<StandardContactLeadEntity>[] {
  return [
    {
      entity: "fullName",
      label: "Full name",
      patterns: [/(?:my name is|i am|this is)\s+([a-z]+(?:\s+[a-z]+){0,3})/i, /name\s+(?:is|'s)?\s*([a-z]+(?:\s+[a-z]+){0,3})/i],
      normalize: (value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
    {
      entity: "phone",
      label: "Phone",
      patterns: [/(?:\+44\s?7\d{3}[\s-]?\d{3}[\s-]?\d{3}|07\d{3}[\s-]?\d{3}[\s-]?\d{3})/i],
      normalize: (value) => value.replace(/\s+/g, " ").trim(),
    },
    {
      entity: "email",
      label: "Email",
      patterns: [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
      normalize: (value) => value.toLowerCase(),
    },
    {
      entity: "postcode",
      label: "Postcode",
      patterns: [/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i],
      normalize: (value) => value.toUpperCase().replace(/\s+/g, " ").trim(),
    },
    {
      entity: "address",
      label: "Address",
      patterns: [/(?:address is|at)\s+(.+)/i],
    },
    {
      entity: "preferredVisitTime",
      label: "Preferred visit time",
      patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
    },
  ];
}

export function createStandardSummaryTemplates(profileName: string, overrides: Partial<FlowSummaryTemplates> = {}): FlowSummaryTemplates {
  return {
    appointmentRecommendation: `Offer the earliest available callback or visit and confirm the required details for ${profileName}.`,
    caseSummary: `No urgent safety concerns detected. Continue the ${profileName} triage professionally.`,
    followUpRecommendation: "Send the callback summary and monitor for response.",
    patientSummary: `${profileName} customer summary pending.`,
    receptionNotes: `${profileName} reception notes pending.`,
    sms: `Hi, thanks for contacting ${profileName}. Sorry we missed you. Reply YES and we'll call you back.`,
    email: `Thanks for contacting ${profileName}. The team will review your request and follow up shortly.`,
    ...overrides,
  };
}

export function createStandardMessageTemplates(profileName: string, overrides: Partial<FlowMessageTemplates> = {}): FlowMessageTemplates {
  return {
    email: {
      subject: `${profileName} follow-up`,
      body: `Thanks for contacting ${profileName}. The team will review your request and follow up shortly.`,
      ...overrides.email,
    },
    sms: {
      help: `Thanks for getting in touch. We'll have the team review this and reply shortly.`,
      missedCallRecovery: `Hi, thanks for contacting ${profileName}. Sorry we missed you. Reply YES and we'll call you back.`,
      optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
      replyYes: "Thanks. We'll call you back shortly.",
      resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
      ...overrides.sms,
    },
  };
}

export function createStandardKnowledgeBase(options: {
  businessRules: string[];
  entityCatalog: readonly FlowEntityDefinition<string>[];
  prompts: FlowKnowledgeBase["prompts"];
  safeResponses: string[];
}): FlowKnowledgeBase {
  return {
    businessRules: options.businessRules,
    entityCatalog: options.entityCatalog,
    prompts: options.prompts,
    safeResponses: options.safeResponses,
  };
}

export function createWorkflowCondition(
  field: string,
  operator: FlowWorkflowConditionOperator,
  value: FlowWorkflowCondition["value"] = undefined,
  label = field,
  description?: string,
): FlowWorkflowCondition {
  return {
    description,
    field,
    label,
    operator,
    value,
  };
}

export function createWorkflowAction(
  id: string,
  type: FlowWorkflowActionType,
  label: string,
  description: string,
  payload?: Record<string, unknown>,
): FlowWorkflowAction {
  return {
    description,
    enabled: true,
    id,
    label,
    payload,
    type,
  };
}

export function createWorkflowStep(
  id: string,
  label: string,
  description: string,
  actionIds: readonly string[],
  options: {
    conditionMode?: "all" | "any";
    conditions?: readonly FlowWorkflowCondition[];
    continueOnError?: boolean;
    fallbackActionIds?: readonly string[];
  } = {},
): FlowWorkflowStep {
  return {
    actionIds,
    conditionMode: options.conditionMode,
    conditions: options.conditions,
    continueOnError: options.continueOnError ?? false,
    description,
    fallbackActionIds: options.fallbackActionIds,
    id,
    label,
  };
}

export function createWorkflowFallback(label: string, description: string, actionIds: readonly string[]): FlowWorkflowFallback {
  return {
    actionIds,
    description,
    label,
  };
}

export function createWorkflowAuditTrail(
  eventTypes: readonly string[],
  note: string,
  options: Partial<Omit<FlowWorkflowAuditTrail, "eventTypes" | "note">> = {},
): FlowWorkflowAuditTrail {
  return {
    enabled: options.enabled ?? true,
    entityTable: options.entityTable ?? "audit_events",
    eventTypes,
    note,
    riskLevel: options.riskLevel ?? "medium",
  };
}

export function createWorkflowDefinition(definition: FlowWorkflowDefinition): FlowWorkflowDefinition {
  return {
    ...definition,
    status: definition.status ?? "active",
  };
}

export function createStandardWorkflowSet(options: {
  profileId: string;
  answerDescription: string;
  answerHandler: string;
  persistDescription: string;
  persistHandler: string;
  profileName: string;
  recoveryHandler: string;
  recoveryLabel?: string;
  summaryDescription: string;
  summaryHandler: string;
  speechDescription: string;
  speechHandler: string;
}): readonly FlowWorkflowDefinition[] {
  const profileCondition = createWorkflowCondition("profileId", "equals", options.profileId, "Active profile", "Run only for the active Flow profile.");

  return [
    createWorkflowDefinition({
      actions: [
        createWorkflowAction("classify-intent", "classify_intent", "Classify intent", `Identify the caller's reason for contacting ${options.profileName}.`),
        createWorkflowAction("extract-entities", "extract_entities", "Extract entities", "Capture names, contact details, and service details."),
        createWorkflowAction("score-urgency", "score_urgency", "Score urgency", "Apply the profile urgency rules."),
        createWorkflowAction("create-lead", "create_lead", "Create lead", "Create or update the CRM lead for the call."),
        createWorkflowAction("update-dashboard", "update_dashboard", "Update dashboard", "Refresh live metrics and queue indicators."),
      ],
      auditTrail: createWorkflowAuditTrail(["workflow.started", "workflow.completed", "workflow.failed"], `Capture the inbound voice intake flow for ${options.profileName}.`),
      channel: "voice",
      conditions: [profileCondition],
      description: options.answerDescription,
      fallback: createWorkflowFallback("Human receptionist fallback", "Transfer to a human if the AI flow cannot continue.", [
        "handoff-to-human",
        "notify-staff",
      ]),
      handler: options.answerHandler,
      key: "answer-inbound-call",
      label: "Answer inbound call",
      profileId: options.profileId,
      steps: [
        createWorkflowStep(
          "answer-greeting",
          "Greet and capture",
          "Open with a warm greeting and ask for the caller's reason.",
          ["classify-intent", "extract-entities"],
          { continueOnError: true },
        ),
        createWorkflowStep(
          "answer-triage",
          "Triage urgency",
          "Score urgency and prepare the next response.",
          ["score-urgency", "create-lead"],
          { fallbackActionIds: ["handoff-to-human"] },
        ),
        createWorkflowStep("answer-dashboard", "Update operations", "Record the intake on the dashboard.", ["update-dashboard"], { continueOnError: true }),
      ],
      status: "active",
      trigger: "inbound_call_completed",
    }),
    createWorkflowDefinition({
      actions: [
        createWorkflowAction("extract-entities", "extract_entities", "Extract entities", "Capture names, contact details, and next steps from the caller."),
        createWorkflowAction("add-note", "add_note", "Add note", "Store the caller's message for the team."),
        createWorkflowAction("create-task", "create_task", "Create task", "Queue a follow-up task for the team."),
        createWorkflowAction("update-summary", "update_call_summary", "Update summary", "Refresh the call summary with the latest speech capture."),
      ],
      auditTrail: createWorkflowAuditTrail(["workflow.started", "workflow.completed", "workflow.failed"], `Continue the speech-driven conversation for ${options.profileName}.`),
      channel: "workflow",
      conditions: [profileCondition],
      description: options.speechDescription,
      fallback: createWorkflowFallback("Human receptionist fallback", "If speech is unclear, keep the team in the loop and allow transfer.", ["notify-staff", "handoff-to-human"]),
      handler: options.speechHandler,
      key: "continue-voice-conversation",
      label: "Continue conversation",
      profileId: options.profileId,
      steps: [
        createWorkflowStep("speech-capture", "Capture speech", "Review the caller's speech and extract the key details.", ["extract-entities", "add-note"], { continueOnError: true }),
        createWorkflowStep("speech-action", "Prepare next action", "Create the task and update the live summary.", ["create-task", "update-summary"], { fallbackActionIds: ["notify-staff"] }),
      ],
      status: "active",
      trigger: "message_received",
    }),
    createWorkflowDefinition({
      actions: [
        createWorkflowAction("mark-recovery", "mark_recovery_status", "Mark recovery", "Track the missed call recovery stage."),
        createWorkflowAction("send-sms", "send_sms", "Send SMS", `Send the recovery SMS from ${options.profileName}.`),
        createWorkflowAction("schedule-callback", "schedule_callback", "Schedule callback", "Queue the callback for the team."),
        createWorkflowAction("notify-staff", "notify_staff", "Notify staff", "Alert reception that a recovery SMS has been sent."),
      ],
      auditTrail: createWorkflowAuditTrail(["workflow.started", "workflow.completed", "workflow.failed"], `Run the missed-call recovery loop for ${options.profileName}.`),
      channel: "sms",
      conditions: [profileCondition, createWorkflowCondition("responseState", "not_equals", "responded", "No response yet")],
      description: `Send a missed-call recovery SMS and keep the ${options.profileName} workflow moving.`,
      fallback: createWorkflowFallback("Recovery escalation", "If the SMS cannot be delivered, notify the team and schedule a callback.", ["notify-staff", "schedule-callback"]),
      handler: options.recoveryHandler,
      key: "send-missed-call-recovery",
      label: options.recoveryLabel ?? "Send recovery SMS",
      profileId: options.profileId,
      steps: [
        createWorkflowStep("recovery-status", "Mark recovery", "Record the recovery stage before sending the text.", ["mark-recovery"], { continueOnError: true }),
        createWorkflowStep("recovery-sms", "Send recovery SMS", "Send the template and confirm the queue state.", ["send-sms", "notify-staff"], { fallbackActionIds: ["schedule-callback"] }),
      ],
      status: "active",
      trigger: "missed_call",
    }),
    createWorkflowDefinition({
      actions: [
        createWorkflowAction("create-lead", "create_lead", "Create lead", "Create or update the CRM lead."),
        createWorkflowAction("assign-owner", "assign_owner", "Assign owner", "Assign the lead to the right team member."),
        createWorkflowAction("create-task", "create_task", "Create task", "Create the follow-up task for reception."),
        createWorkflowAction("update-dashboard", "update_dashboard", "Update dashboard", "Refresh the dashboard once the lead is stored."),
      ],
      auditTrail: createWorkflowAuditTrail(["workflow.started", "workflow.completed", "workflow.failed"], `Persist the lead record for ${options.profileName}.`),
      channel: "workflow",
      conditions: [profileCondition],
      description: options.persistDescription,
      fallback: createWorkflowFallback("Lead persistence fallback", "If the CRM write fails, notify staff and retry later.", ["notify-staff", "create-task"]),
      handler: options.persistHandler,
      key: "persist-call",
      label: "Persist call",
      profileId: options.profileId,
      steps: [
        createWorkflowStep("persist-lead", "Create or update lead", "Write the lead to CRM and assign an owner.", ["create-lead", "assign-owner"], { continueOnError: false }),
        createWorkflowStep("persist-task", "Create follow-up task", "Create the task and refresh the dashboard.", ["create-task", "update-dashboard"], { fallbackActionIds: ["notify-staff"] }),
      ],
      status: "active",
      trigger: "new_lead_created",
    }),
    createWorkflowDefinition({
      actions: [
        createWorkflowAction("update-summary", "update_call_summary", "Update summary", "Refresh the reception summary for the dashboard."),
        createWorkflowAction("add-note", "add_note", "Add note", "Write a concise audit note for the call."),
        createWorkflowAction("notify-staff", "notify_staff", "Notify staff", "Let the team know the summary is ready."),
      ],
      auditTrail: createWorkflowAuditTrail(["workflow.started", "workflow.completed", "workflow.failed"], `Generate the reception summary for ${options.profileName}.`),
      channel: "workflow",
      conditions: [profileCondition],
      description: options.summaryDescription,
      fallback: createWorkflowFallback("Summary fallback", "If summary generation fails, notify the team and keep the call visible.", ["notify-staff"]),
      handler: options.summaryHandler,
      key: "generate-call-summary",
      label: "Generate summary",
      profileId: options.profileId,
      steps: [
        createWorkflowStep("summary-refresh", "Refresh summary", "Update the call summary with the latest data.", ["update-summary", "add-note"], { continueOnError: true }),
        createWorkflowStep("summary-notify", "Notify team", "Let the team know the summary is ready.", ["notify-staff"], { continueOnError: true }),
      ],
      status: "active",
      trigger: "follow_up_due",
    }),
  ] as const;
}
