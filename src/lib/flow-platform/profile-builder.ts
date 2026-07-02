import { defineFlowPlatformProfile } from "./factory";
import type {
  FlowEntityDefinition,
  FlowKnowledgeBase,
  FlowMessageTemplates,
  FlowPlatformProfile,
  FlowSummaryTemplates,
  FlowWorkflowDefinition,
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

export function createStandardWorkflowSet(options: {
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
  return [
    {
      channel: "voice",
      description: options.answerDescription,
      handler: options.answerHandler,
      key: "answer-inbound-call",
      label: "Answer inbound call",
      trigger: "twilio.voice.received",
    },
    {
      channel: "workflow",
      description: options.speechDescription,
      handler: options.speechHandler,
      key: "continue-voice-conversation",
      label: "Continue conversation",
      trigger: "twilio.voice.speech",
    },
    {
      channel: "sms",
      description: `Send a missed-call recovery SMS and keep the ${options.profileName} workflow moving.`,
      handler: options.recoveryHandler,
      key: "send-missed-call-recovery",
      label: options.recoveryLabel ?? "Send recovery SMS",
      trigger: "call.missed",
    },
    {
      channel: "workflow",
      description: options.persistDescription,
      handler: options.persistHandler,
      key: "persist-call",
      label: "Persist call",
      trigger: "twilio.call.received",
    },
    {
      channel: "workflow",
      description: options.summaryDescription,
      handler: options.summaryHandler,
      key: "generate-call-summary",
      label: "Generate summary",
      trigger: "call.summary.requested",
    },
  ] as const;
}
