import {
  createFlowPlatformProfile,
  createStandardContactLeadEntities,
  createStandardContactVoiceEntities,
  createStandardKnowledgeBase,
  createStandardMessageTemplates,
  createStandardSummaryTemplates,
  createStandardWorkflowSet,
  type StandardContactLeadEntity,
  type StandardContactVoiceEntity,
} from "../profile-builder";
import type { FlowPlatformProfile } from "../types";

export type BuildFlowVoiceIntent =
  | "new_build_quote"
  | "extension_quote"
  | "renovation_work"
  | "structural_concern"
  | "roof_repair"
  | "planned_works"
  | "handover_issue"
  | "budget_question"
  | "urgent_issue"
  | "other_unclear";

export type BuildFlowActionIntent =
  | "quote"
  | "extension"
  | "renovation"
  | "structural"
  | "roof"
  | "planned"
  | "handover"
  | "budget"
  | "urgent"
  | "other";

export type BuildFlowLeadIntent =
  | "new_job"
  | "quote_request"
  | "urgent_issue"
  | "project_follow_up"
  | "general_admin";

type BuildFlowVoiceEntity =
  | StandardContactVoiceEntity
  | "budget"
  | "deadline"
  | "projectType"
  | "propertyType"
  | "startDate"
  | "accessNotes";

type BuildFlowLeadEntity =
  | StandardContactLeadEntity
  | "accessNotes"
  | "appointmentPreference"
  | "budget"
  | "customerType"
  | "deadline"
  | "issue"
  | "preferredVisitTime"
  | "projectType"
  | "propertyType"
  | "urgency";

const voiceIntentDefinitions = [
  {
    intent: "new_build_quote" as const,
    label: "New build quote",
    keywords: ["new build", "new home", "house build", "new project"],
    followUpQuestion: "Of course. Could I have the postcode, property type, and when you'd like the team to call you back?",
    priority: 3,
    summaryHint: "Capture the project scope and callback preference.",
  },
  {
    intent: "extension_quote" as const,
    label: "Extension quote",
    keywords: ["extension", "house extension", "side return", "rear extension"],
    followUpQuestion: "Absolutely. Could I have the postcode and a quick idea of the extension you're planning?",
    priority: 3,
    summaryHint: "Capture the extension scope and preferred visit time.",
  },
  {
    intent: "renovation_work" as const,
    label: "Renovation work",
    keywords: ["renovation", "refurbishment", "conversion", "remodelling"],
    followUpQuestion: "Certainly. What part of the property are you renovating, and when would you like to start?",
    priority: 3,
    summaryHint: "Capture the renovation scope and timeline.",
  },
  {
    intent: "structural_concern" as const,
    label: "Structural concern",
    keywords: ["structural", "crack", "movement", "subsidence", "wall issue"],
    followUpQuestion: "I'm sorry to hear that. Is there any immediate safety concern right now?",
    priority: 5,
    summaryHint: "Treat as urgent and capture the visible symptoms.",
    escalate: true,
  },
  {
    intent: "roof_repair" as const,
    label: "Roof repair",
    keywords: ["roof", "leak", "tiles", "felt", "ridge", "roofing"],
    followUpQuestion: "Of course. Is it a leak, damage, or something else, and when did it begin?",
    priority: 4,
    summaryHint: "Capture the roof fault and likely urgency.",
  },
  {
    intent: "planned_works" as const,
    label: "Planned works",
    keywords: ["planned works", "schedule", "project", "quote", "design"],
    followUpQuestion: "Certainly. Could I have the property details and the best time for a callback?",
    priority: 2,
    summaryHint: "Capture the planned works brief and timeline.",
  },
  {
    intent: "handover_issue" as const,
    label: "Handover issue",
    keywords: ["handover", "snagging", "defect", "completion", "builder"],
    followUpQuestion: "I can help with that. Could I have the address and a quick summary of the issue?",
    priority: 3,
    summaryHint: "Capture the snagging details and contact information.",
  },
  {
    intent: "budget_question" as const,
    label: "Budget question",
    keywords: ["budget", "cost", "price", "how much", "estimate"],
    followUpQuestion: "Prices vary by scope, so I can arrange a call or survey to provide a proper estimate.",
    priority: 2,
    summaryHint: "Avoid quoting without a survey and capture the scope.",
  },
  {
    intent: "urgent_issue" as const,
    label: "Urgent issue",
    keywords: ["urgent", "emergency", "unsafe", "collapse", "danger"],
    followUpQuestion: "I'm sorry - is anyone at risk right now?",
    priority: 5,
    summaryHint: "Escalate immediately and capture the exact risk.",
    escalate: true,
  },
  {
    intent: "other_unclear" as const,
    label: "Other or unclear",
    keywords: ["other", "unsure", "unknown"],
    followUpQuestion: "No problem. Could you tell me a little more so I can help properly?",
    priority: 1,
    summaryHint: "Ask for one simple clarification.",
  },
] satisfies FlowPlatformProfile<BuildFlowVoiceIntent, BuildFlowVoiceEntity, BuildFlowActionIntent, BuildFlowLeadIntent, BuildFlowLeadEntity>["conversation"]["voice"]["intentDefinitions"];

const leadIntentDefinitions = [
  {
    intent: "new_job" as const,
    label: "New job enquiry",
    keywords: ["builder", "construction", "new job", "quote", "help with work"],
    followUpQuestion: "Could I have your name, phone number, postcode, and a brief description of the work?",
    priority: 2,
    summaryHint: "Capture the new enquiry details and preferred contact time.",
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "budget", "price", "cost"],
    followUpQuestion: "Could I have the address, project type, and a preferred time for the survey?",
    priority: 2,
    summaryHint: "Capture the scope and visit window.",
  },
  {
    intent: "urgent_issue" as const,
    label: "Urgent issue",
    keywords: ["urgent", "emergency", "unsafe", "collapse", "danger"],
    followUpQuestion: "I'm sorry - is anyone at risk right now, and can you tell me the exact address?",
    priority: 5,
    summaryHint: "Escalate immediately and capture the exact risk.",
    escalate: true,
  },
  {
    intent: "project_follow_up" as const,
    label: "Project follow-up",
    keywords: ["follow up", "update", "progress", "snagging", "handover"],
    followUpQuestion: "Of course. Could I have the address and the person we should update?",
    priority: 2,
    summaryHint: "Capture the follow-up and the key contact details.",
  },
  {
    intent: "general_admin" as const,
    label: "General administration",
    keywords: ["admin", "question", "message", "callback"],
    followUpQuestion: "Of course. Could you tell me a little more so I can route this properly?",
    priority: 1,
    summaryHint: "Route to the office with a calm callback.",
  },
] satisfies FlowPlatformProfile<BuildFlowVoiceIntent, BuildFlowVoiceEntity, BuildFlowActionIntent, BuildFlowLeadIntent, BuildFlowLeadEntity>["conversation"]["leads"]["intentDefinitions"];

const voiceEntityDefinitions = [
  ...createStandardContactVoiceEntities(),
  {
    entity: "projectType" as const,
    label: "Project type",
    patterns: [/(new build|extension|renovation|refurbishment|conversion|roof repair|handover|snagging|structural)/i],
  },
  {
    entity: "propertyType" as const,
    label: "Property type",
    patterns: [/(house|flat|apartment|bungalow|commercial|office|rental|detached|semi-detached|terraced)/i],
  },
  {
    entity: "budget" as const,
    label: "Budget",
    patterns: [/(?:budget|estimate|cost|price)\s+(?:of|around|up to)?\s*£?(\d[\d,]*)/i],
    normalize: (value: string) => value.replace(/\s+/g, " ").trim(),
  },
  {
    entity: "startDate" as const,
    label: "Start date",
    patterns: [/(?:start|begin|commence)(?:\s+date)?\s+(?:on\s+)?([a-z0-9,\s-]+)/i],
  },
  {
    entity: "deadline" as const,
    label: "Deadline",
    patterns: [/(?:deadline|by)\s+([a-z0-9,\s-]+)/i],
  },
  {
    entity: "accessNotes" as const,
    label: "Access notes",
    patterns: [/(?:access notes|access|parking|entry)\s+(.+)/i],
  },
] satisfies FlowPlatformProfile<BuildFlowVoiceIntent, BuildFlowVoiceEntity, BuildFlowActionIntent, BuildFlowLeadIntent, BuildFlowLeadEntity>["conversation"]["voice"]["entityDefinitions"];

const leadEntityDefinitions = [
  ...createStandardContactLeadEntities(),
  {
    entity: "customerType" as const,
    label: "Customer type",
    patterns: [/(homeowner|landlord|tenant|developer|contractor|agent|business owner|commercial client)/i],
  },
  {
    entity: "projectType" as const,
    label: "Project type",
    patterns: [/(new build|extension|renovation|refurbishment|conversion|roof repair|handover|snagging|structural)/i],
  },
  {
    entity: "propertyType" as const,
    label: "Property type",
    patterns: [/(house|flat|apartment|bungalow|commercial|office|rental|detached|semi-detached|terraced)/i],
  },
  {
    entity: "budget" as const,
    label: "Budget",
    patterns: [/(?:budget|estimate|cost|price)\s+(?:of|around|up to)?\s*£?(\d[\d,]*)/i],
  },
  {
    entity: "deadline" as const,
    label: "Deadline",
    patterns: [/(?:deadline|by)\s+([a-z0-9,\s-]+)/i],
  },
  {
    entity: "accessNotes" as const,
    label: "Access notes",
    patterns: [/(?:access notes|access|parking|entry)\s+(.+)/i],
  },
] satisfies FlowPlatformProfile<BuildFlowVoiceIntent, BuildFlowVoiceEntity, BuildFlowActionIntent, BuildFlowLeadIntent, BuildFlowLeadEntity>["conversation"]["leads"]["entityDefinitions"];

const actionDefinitions = [
  { intent: "quote" as const, label: "Quote", keywords: ["quote", "estimate", "cost"], followUpQuestion: "Could I have the address and a quick idea of the project?", priority: 2, summaryHint: "Capture the project scope and survey request." },
  { intent: "extension" as const, label: "Extension", keywords: ["extension", "house extension", "side return"], followUpQuestion: "Could I have the postcode and a brief idea of the extension?", priority: 3, summaryHint: "Capture the extension scope and visit window." },
  { intent: "renovation" as const, label: "Renovation", keywords: ["renovation", "refurbishment", "conversion"], followUpQuestion: "What part of the property are you renovating, and when would you like to start?", priority: 3, summaryHint: "Capture the renovation scope and timeline." },
  { intent: "structural" as const, label: "Structural concern", keywords: ["structural", "crack", "movement"], followUpQuestion: "Is there any immediate safety concern right now?", priority: 5, summaryHint: "Treat as urgent and capture the visible symptoms.", escalate: true },
  { intent: "roof" as const, label: "Roof repair", keywords: ["roof", "leak", "tiles"], followUpQuestion: "Is it a leak, damage, or something else, and when did it begin?", priority: 4, summaryHint: "Capture the roof fault and likely urgency." },
  { intent: "planned" as const, label: "Planned works", keywords: ["planned works", "project", "schedule"], followUpQuestion: "Could I have the property details and the best time for a callback?", priority: 2, summaryHint: "Capture the planned works brief and timeline." },
  { intent: "handover" as const, label: "Handover issue", keywords: ["handover", "snagging", "defect"], followUpQuestion: "Could I have the address and a quick summary of the issue?", priority: 3, summaryHint: "Capture the snagging details and contact information." },
  { intent: "budget" as const, label: "Budget question", keywords: ["budget", "cost", "price"], followUpQuestion: "Prices vary by scope, so I can arrange a call or survey to provide a proper estimate.", priority: 2, summaryHint: "Avoid quoting without a survey and capture the scope." },
  { intent: "urgent" as const, label: "Urgent issue", keywords: ["urgent", "emergency", "unsafe"], followUpQuestion: "Is anyone at risk right now?", priority: 5, summaryHint: "Escalate immediately and capture the exact risk.", escalate: true },
  { intent: "other" as const, label: "Other", keywords: ["other", "general", "question"], followUpQuestion: "Could you tell me a little more so I can help properly?", priority: 1, summaryHint: "Ask for one simple clarification." },
] satisfies FlowPlatformProfile<BuildFlowVoiceIntent, BuildFlowVoiceEntity, BuildFlowActionIntent, BuildFlowLeadIntent, BuildFlowLeadEntity>["conversation"]["voice"]["actionDefinitions"];

export const buildFlowPlatformProfile = createFlowPlatformProfile({
  clinic: {
    appointmentRules: [
      "Offer the earliest available survey or callback and confirm access details.",
      "Check postcode, property type, and safety symptoms before promising a slot.",
      "Use safety-first language for structural and urgent issues.",
    ],
    businessHours: "Monday to Saturday, 8:00am to 6:00pm",
    locale: "en-GB",
    name: "BuildFlow Construction",
    region: "United Kingdom",
    branding: {
      accent: "amber",
      background: "#fff9f1",
      icon: "hammer",
      logoText: "BF",
      primary: "#2f2316",
      secondary: "#d97706",
      surface: "#ffffff",
      text: "#2b2417",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["urgent_issue"],
      escalationRules: [
        "Structural concerns and unsafe conditions should escalate immediately.",
        "Never promise fixed pricing without a proper survey.",
        "Always offer a human callback when the caller asks.",
      ],
      fallbackIntent: "general_admin",
      fallbackPrompt: "Could you tell me a little more so I can route this properly?",
      intentDefinitions: leadIntentDefinitions,
      recoveryRules: [
        "Use the approved callback SMS when the caller wants a follow-up.",
        "Record opt-outs and avoid repeat messaging after that point.",
        "Keep after-hours recovery warm and concise.",
      ],
      summaryTemplates: createStandardSummaryTemplates("BuildFlow Construction", {
        caseSummary: "No urgent structural concerns detected. Continue the build triage professionally.",
      }),
      templates: createStandardMessageTemplates("BuildFlow Construction"),
      businessHoursPrompt: "Please route only urgent safety issues outside business hours.",
      conversationTone: "warm, calm, professional, British, practical",
      language: "en-GB",
      urgencyRules: [
        "Structural concerns and unsafe issues are the highest priority.",
        "Roof leaks and handover issues should be treated as urgent when damage is active.",
        "Quotes and planned works are lower urgency unless the caller mentions danger.",
      ],
    },
    voice: {
      actionDefinitions,
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, practical, and reassuring.",
      emergencyPrompt: "If the caller thinks the property may be unsafe, advise them to stay away from danger and contact the appropriate emergency service if needed.",
      businessHoursPrompt: "Please route only urgent safety issues outside business hours.",
      entityDefinitions: voiceEntityDefinitions,
      escalationIntents: ["structural_concern", "urgent_issue"],
      escalationRules: [
        "Structural concerns and urgent safety issues should escalate immediately.",
        "Never promise fixed pricing without a proper survey.",
        "Always offer a receptionist or surveyor callback if requested.",
      ],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to BuildFlow, and I can help with quotes, extensions, renovation work, roof repairs, and urgent site concerns. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["builder", "survey", "site", "contractor", "project", "property"],
      language: "en-GB",
      pronunciations: [{ sayAs: "BuildFlow", term: "BuildFlow" }],
      recoveryRules: [
        "Keep callback offers warm and concise.",
        "Use voicemail for callers who cannot stay on the line.",
        "If the caller goes silent, transfer to the human fallback without delay.",
      ],
      speechRate: "96%",
      ssmlBreakMs: 220,
      ssmlEnabled: true,
      summaryTemplates: createStandardSummaryTemplates("BuildFlow Construction", {
        caseSummary: "No urgent structural concerns detected. Continue the build triage professionally.",
      }),
      urgencyRules: [
        "Structural concerns are the highest emergency priority.",
        "Roof repair and handover issues should score highest after safety alerts.",
        "Quotes and planned works are lower priority unless the caller mentions active danger.",
      ],
      templates: createStandardMessageTemplates("BuildFlow Construction"),
      conversationTone: "warm, professional, confident, calm, friendly, British, practical",
      voice: "Polly.Amy-Neural",
    },
  },
  dashboard: {
    colors: {
      background: "#fff9f1",
      primary: "#2f2316",
      secondary: "#d97706",
      surface: "#ffffff",
      text: "#2b2417",
    },
    icons: ["hammer", "calendar-check", "message-square", "shield-alert", "house"],
    labels: {
      activeCalls: "Active calls",
      followUp: "Follow-up queue",
      missedCalls: "Missed calls",
      recovery: "Recovery",
      revenueRecovered: "Recovered revenue",
      responseRate: "Response rate",
    },
  },
  id: "buildflow",
  industry: {
    description: "Construction, building, and project enquiry reception workflow configuration.",
    key: "construction",
    name: "Construction",
    terminology: ["builder", "survey", "site", "project", "contractor"],
  },
  knowledgeBase: createStandardKnowledgeBase({
    businessRules: [
      "Never promise fixed pricing without a proper survey.",
      "Structural and unsafe site issues require immediate escalation.",
      "Always ask for postcode, access notes, and property type for planning.",
      "Keep the language practical, calm, and professional.",
    ],
    entityCatalog: [...leadEntityDefinitions],
    prompts: [
      {
        key: "call-greeting",
        title: "Call greeting",
        prompt: "Warm, calm British greeting that reassures the caller and offers help without sounding scripted.",
      },
      {
        key: "triage",
        title: "Triage",
        prompt: "Ask one question at a time, identify the issue, and escalate immediately when safety requires it.",
      },
      {
        key: "summary",
        title: "Summary",
        prompt: "Summarise the call clearly for the operations team with urgency, access notes, and contact details.",
      },
    ],
    safeResponses: [
      "I can certainly help with that.",
      "I'm sorry you're dealing with that.",
      "Let's get the right builder lined up.",
      "Thank you. I've made a note.",
    ],
  }),
  notifications: [
    { channel: "dashboard", key: "call-summary-ready", template: "Show the summary on the live dashboard as soon as the call is captured.", trigger: "call.summary.created" },
    { channel: "sms", key: "missed-call-recovery", template: "Send the missed call recovery SMS from the active profile.", trigger: "call.missed" },
    { channel: "email", key: "safety-escalation", template: "Email the team when a structural issue is captured.", trigger: "lead.escalated" },
  ],
  workflows: createStandardWorkflowSet({
    answerDescription: "Answer the call with a warm construction receptionist greeting.",
    answerHandler: "handleBuildFlowVoiceWebhook",
    profileId: "buildflow",
    persistDescription: "Create or update the lead record and recovery workflow.",
    persistHandler: "processBuildFlowCallWebhook",
    profileName: "BuildFlow Construction",
    recoveryHandler: "sendBuildFlowRecoverySms",
    summaryDescription: "Generate the receptionist summary for the dashboard.",
    summaryHandler: "generateBuildFlowCallSummary",
    speechDescription: "Collect speech input and continue the triage conversation.",
    speechHandler: "handleBuildFlowVoiceSpeechWebhook",
  }),
});
