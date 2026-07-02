import { defineFlowPlatformProfile } from "../factory";

export type HeatFlowVoiceIntent =
  | "boiler_failure"
  | "no_heating"
  | "no_hot_water"
  | "underfloor_heating"
  | "heat_pump_issue"
  | "service_booking"
  | "quote_request"
  | "other_unclear";

export type HeatFlowActionIntent =
  | "boiler_failure"
  | "heating"
  | "hot_water"
  | "underfloor_heating"
  | "heat_pump"
  | "service_booking"
  | "quote_request"
  | "other";

export type HeatFlowLeadIntent =
  | "new_job"
  | "boiler_issue"
  | "heating_issue"
  | "quote_request"
  | "service_booking"
  | "general_admin";

const summaryTemplates = {
  appointmentRecommendation: "Offer the earliest available engineer visit or callback and confirm access details.",
  caseSummary: "No urgent safety concerns detected. Continue heating triage.",
  followUpRecommendation: "Send the callback or quote summary and monitor for response.",
  patientSummary: "Customer summary pending.",
  receptionNotes: "Reception notes pending.",
  sms: "Hi, thanks for contacting HeatFlow. Sorry we missed you. Reply YES and we'll call you back.",
  email: "Thanks for contacting HeatFlow. The team will review your request and follow up shortly.",
};

const voiceIntentDefinitions = [
  {
    intent: "boiler_failure" as const,
    label: "Boiler failure",
    keywords: ["boiler failure", "boiler not working", "boiler broken", "boiler issue"],
    followUpQuestion: "I'm sorry - is there any heating or hot water at all, and when did it stop working?",
    priority: 5,
    summaryHint: "Treat as urgent and capture the system symptoms.",
    escalate: true,
  },
  {
    intent: "no_heating" as const,
    label: "No heating",
    keywords: ["no heating", "heating off", "radiators cold", "no heat"],
    followUpQuestion: "Of course. Is the whole property affected, and do you have hot water?",
    priority: 4,
    summaryHint: "Capture the extent of the heating loss.",
  },
  {
    intent: "no_hot_water" as const,
    label: "No hot water",
    keywords: ["no hot water", "hot water gone", "water not heating"],
    followUpQuestion: "Understood. Is the heating affected too, or is it only the hot water?",
    priority: 4,
    summaryHint: "Gather heating context and urgency.",
  },
  {
    intent: "underfloor_heating" as const,
    label: "Underfloor heating",
    keywords: ["underfloor heating", "ufh", "floor heating"],
    followUpQuestion: "Absolutely. Which area is affected and what exactly is happening?",
    priority: 3,
    summaryHint: "Capture the affected area and symptoms.",
  },
  {
    intent: "heat_pump_issue" as const,
    label: "Heat pump issue",
    keywords: ["heat pump", "air source heat pump", "ground source heat pump", "heatpump"],
    followUpQuestion: "Certainly. What's happening with the heat pump, and when did it start?",
    priority: 4,
    summaryHint: "Capture the fault and appointment availability.",
  },
  {
    intent: "service_booking" as const,
    label: "Service booking",
    keywords: ["service", "maintenance", "annual service", "check", "service booking"],
    followUpQuestion: "Of course. Could I have your postcode and the best time for the team to call you back?",
    priority: 2,
    summaryHint: "Capture the service request and contact details.",
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "cost", "how much"],
    followUpQuestion: "Absolutely. Could I have your postcode, property type, and a preferred time for the quote visit?",
    priority: 2,
    summaryHint: "Capture the request and preferred visit window.",
  },
  {
    intent: "other_unclear" as const,
    label: "Other or unclear",
    keywords: ["other", "unsure", "unknown"],
    followUpQuestion: "No problem. Could you tell me a little more so I can help properly?",
    priority: 1,
    summaryHint: "Ask for one simple clarification.",
  },
] as const;

const leadIntentDefinitions = [
  {
    intent: "new_job" as const,
    label: "New job enquiry",
    keywords: ["new job", "heating engineer", "call out", "help with heating"],
    followUpQuestion: "Could I have your name, phone number, postcode, and a brief description of the issue?",
    priority: 2,
    summaryHint: "Capture the new enquiry details and preferred contact time.",
  },
  {
    intent: "boiler_issue" as const,
    label: "Boiler issue",
    keywords: ["boiler", "no hot water", "boiler failure", "pressure", "pilot light"],
    followUpQuestion: "Could I have your postcode, the boiler symptoms, and a good time for the team to call you back?",
    priority: 5,
    summaryHint: "Escalate quickly and arrange a heating callback or visit.",
    escalate: true,
  },
  {
    intent: "heating_issue" as const,
    label: "Heating issue",
    keywords: ["heating", "radiators", "no heat", "underfloor heating", "cold house"],
    followUpQuestion: "Could I have your postcode and a quick note about what's happening with the heating?",
    priority: 4,
    summaryHint: "Capture the heating fault and access details.",
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "heat pump", "boiler replacement", "installation"],
    followUpQuestion: "Could I have your postcode, property type, and a preferred time for the quotation?",
    priority: 2,
    summaryHint: "Capture the scope and visit window.",
  },
  {
    intent: "service_booking" as const,
    label: "Service booking",
    keywords: ["service", "maintenance", "annual service", "routine"],
    followUpQuestion: "Certainly. Could I have your postcode and the best time for a callback?",
    priority: 2,
    summaryHint: "Capture routine service details.",
  },
  {
    intent: "general_admin" as const,
    label: "General administration",
    keywords: ["admin", "question", "message", "callback"],
    followUpQuestion: "Of course. Could you tell me a little more so I can route this properly?",
    priority: 1,
    summaryHint: "Route to the office with a calm callback.",
  },
] as const;

const leadEntityDefinitions = [
  {
    entity: "fullName" as const,
    label: "Full name",
    patterns: [/(?:my name is|i am|this is)\s+([a-z]+(?:\s+[a-z]+){0,3})/i, /name\s+(?:is|'s)?\s*([a-z]+(?:\s+[a-z]+){0,3})/i],
    normalize: (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
  },
  {
    entity: "phone" as const,
    label: "Phone",
    patterns: [/(?:\+44\s?7\d{3}[\s-]?\d{3}[\s-]?\d{3}|07\d{3}[\s-]?\d{3}[\s-]?\d{3})/i],
    normalize: (value: string) => value.replace(/\s+/g, " ").trim(),
  },
  {
    entity: "email" as const,
    label: "Email",
    patterns: [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
    normalize: (value: string) => value.toLowerCase(),
  },
  {
    entity: "postcode" as const,
    label: "Postcode",
    patterns: [/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i],
    normalize: (value: string) => value.toUpperCase().replace(/\s+/g, " ").trim(),
  },
  {
    entity: "address" as const,
    label: "Address",
    patterns: [/(?:address is|at)\s+(.+)/i],
  },
  {
    entity: "propertyType" as const,
    label: "Property type",
    patterns: [/(house|flat|apartment|bungalow|commercial|office|rental|rented|terraced|semi-detached|detached)/i],
  },
  {
    entity: "issue" as const,
    label: "Issue",
    patterns: [/(?:issue|problem|job|help with|looking at)\s+(.+)/i],
  },
  {
    entity: "urgency" as const,
    label: "Urgency",
    patterns: [/(urgent|asap|immediately|today|emergency|routine|non-urgent)/i],
  },
  {
    entity: "preferredVisitTime" as const,
    label: "Preferred visit time",
    patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
  },
  {
    entity: "appointmentPreference" as const,
    label: "Appointment preference",
    patterns: [/(today|tomorrow|morning|afternoon|evening|this week|next week|weekday|weekend)/i],
  },
  {
    entity: "asset" as const,
    label: "Asset",
    patterns: [/(?:asset|item|system|equipment|boiler|heat pump|radiator)\s+(.+)/i],
  },
  {
    entity: "equipment" as const,
    label: "Equipment",
    patterns: [/(?:equipment|device|machine|boiler|heat pump)\s+(.+)/i],
  },
] as const;

const actionDefinitions = [
  { intent: "boiler_failure" as const, label: "Boiler failure", keywords: ["boiler failure", "boiler not working", "boiler broken"], followUpQuestion: "Is there any heating or hot water at all, and when did it stop working?", priority: 5, summaryHint: "Treat as urgent and capture the system symptoms.", escalate: true },
  { intent: "heating" as const, label: "Heating issue", keywords: ["heating", "radiators", "cold house"], followUpQuestion: "Is the whole property affected, and do you have hot water?", priority: 4, summaryHint: "Capture the extent of the heating loss." },
  { intent: "hot_water" as const, label: "No hot water", keywords: ["no hot water", "hot water gone"], followUpQuestion: "Is the heating affected too, or is it only the hot water?", priority: 4, summaryHint: "Gather heating context and urgency." },
  { intent: "underfloor_heating" as const, label: "Underfloor heating", keywords: ["underfloor heating", "ufh", "floor heating"], followUpQuestion: "Which area is affected and what exactly is happening?", priority: 3, summaryHint: "Capture the affected area and symptoms." },
  { intent: "heat_pump" as const, label: "Heat pump", keywords: ["heat pump", "air source heat pump", "ground source heat pump"], followUpQuestion: "What's happening with the heat pump, and when did it start?", priority: 4, summaryHint: "Capture the fault and appointment availability." },
  { intent: "service_booking" as const, label: "Service booking", keywords: ["service", "maintenance", "annual service"], followUpQuestion: "Could I have your postcode and the best time for the team to call you back?", priority: 2, summaryHint: "Capture the service request and contact details." },
  { intent: "quote_request" as const, label: "Quote request", keywords: ["quote", "estimate", "cost"], followUpQuestion: "Could I have your postcode, property type, and a preferred time for the quote visit?", priority: 2, summaryHint: "Capture the request and preferred visit window." },
  { intent: "other" as const, label: "Other", keywords: ["other", "general", "question"], followUpQuestion: "Could you tell me a little more so I can help properly?", priority: 1, summaryHint: "Ask for one simple clarification." },
] as const;

export const heatFlowPlatformProfile = defineFlowPlatformProfile({
  clinic: {
    appointmentRules: [
      "Offer the earliest available heating engineer visit and confirm access details.",
      "Check postcode, property type, and symptoms before promising a slot.",
      "Use safety-first language for boiler and no-heat situations.",
    ],
    businessHours: "Monday to Saturday, 8:00am to 6:00pm",
    locale: "en-GB",
    name: "HeatFlow Heating",
    region: "United Kingdom",
    branding: {
      accent: "rose",
      background: "#fff6f7",
      icon: "flame",
      logoText: "HF",
      primary: "#32131b",
      secondary: "#d94660",
      surface: "#ffffff",
      text: "#2b191f",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["boiler_issue", "heating_issue"],
      escalationRules: [
        "Boiler failures and heating loss should escalate immediately.",
        "Never advise unsafe repairs or ignore signs of gas issues.",
        "Always offer a human heating engineer if the caller asks.",
      ],
      fallbackIntent: "general_admin",
      fallbackPrompt: "Could you tell me a little more so I can route this properly?",
      intentDefinitions: leadIntentDefinitions,
      recoveryRules: [
        "Use the approved callback SMS when the caller wants a follow-up.",
        "Record opt-outs and avoid repeat messaging after that point.",
        "Keep after-hours recovery warm and concise.",
      ],
      summaryTemplates,
      templates: {
        email: {
          body: "Thanks for contacting HeatFlow Heating. The team will review your request and follow up shortly.",
          subject: "HeatFlow Heating follow-up",
        },
        sms: {
          help: "Thanks for getting in touch. We'll have the team review this and reply shortly.",
          missedCallRecovery: summaryTemplates.sms,
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      businessHoursPrompt: "Please route only urgent heating issues outside business hours.",
      conversationTone: "warm, calm, professional, British, practical",
      language: "en-GB",
      urgencyRules: [
        "Boiler failures and no heating are the highest safety priority.",
        "Heat pump and underfloor heating faults should be treated as urgent when the home has no heat.",
        "Quotes and routine services are lower urgency unless the caller mentions active danger.",
      ],
    },
    voice: {
      actionDefinitions,
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, practical, and reassuring.",
      emergencyPrompt: "If you suspect a dangerous heating or gas issue, advise the caller to stay safe and speak to the emergency service if needed.",
      businessHoursPrompt: "Please route only urgent heating issues outside business hours.",
      entityDefinitions: [
        { entity: "email", label: "Email", patterns: [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i], normalize: (value) => value.toLowerCase() },
        {
          entity: "fullName",
          label: "Full name",
          patterns: [/(?:my name is|i am|this is)\s+([a-z]+(?:\s+[a-z]+){0,3})/i, /name\s+(?:is|'s)?\s*([a-z]+(?:\s+[a-z]+){0,3})/i],
          normalize: (value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        },
        { entity: "phoneNumber", label: "Phone number", patterns: [/(?:\+44\s?7\d{3}[\s-]?\d{3}[\s-]?\d{3}|07\d{3}[\s-]?\d{3}[\s-]?\d{3})/i], normalize: (value) => value.replace(/\s+/g, " ").trim() },
        { entity: "postcode", label: "Postcode", patterns: [/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i], normalize: (value) => value.toUpperCase().replace(/\s+/g, " ").trim() },
        { entity: "address", label: "Address", patterns: [/(?:address is|at)\s+(.+)/i] },
        { entity: "preferredVisitTime", label: "Preferred visit time", patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i] },
      ],
      escalationIntents: ["boiler_failure", "no_heating"],
      escalationRules: [
        "Boiler failures and no-heating calls should escalate immediately.",
        "Never advise unsafe heating repairs.",
        "Always offer a receptionist or engineer callback if requested.",
      ],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to HeatFlow, and I can help with boiler problems, heating loss, hot water, heat pumps, and quote requests. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["boiler", "heating", "hot water", "heat pump", "engineer", "property"],
      language: "en-GB",
      pronunciations: [{ sayAs: "HeatFlow", term: "HeatFlow" }],
      recoveryRules: [
        "Keep callback offers warm and concise.",
        "Use voicemail for callers who cannot stay on the line.",
        "If the caller goes silent, transfer to the human fallback without delay.",
      ],
      speechRate: "96%",
      ssmlBreakMs: 220,
      ssmlEnabled: true,
      summaryTemplates: {
        ...summaryTemplates,
      },
      urgencyRules: [
        "Boiler failure and no heating are the highest emergency priority.",
        "Heat pump and underfloor heating issues should score highest after safety alerts.",
        "Quotes and routine servicing are lower priority unless the caller mentions active danger.",
      ],
      templates: {
        email: {
          body: "Thanks. We've made a note and the team will follow up shortly.",
          subject: "HeatFlow Heating call follow-up",
        },
        sms: {
          help: "Thanks. I've made a note and a member of the team will review it shortly.",
          missedCallRecovery: "Hi, thanks for calling HeatFlow. Sorry we missed you. Reply YES and we'll call you back.",
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      conversationTone: "warm, professional, confident, calm, friendly, British, practical",
      voice: "Polly.Amy-Neural",
    },
  },
  dashboard: {
    colors: {
      background: "#fff6f7",
      primary: "#32131b",
      secondary: "#d94660",
      surface: "#ffffff",
      text: "#2b191f",
    },
    icons: ["flame", "calendar-check", "message-square", "shield-alert", "thermometer-sun"],
    labels: {
      activeCalls: "Active calls",
      followUp: "Follow-up queue",
      missedCalls: "Missed calls",
      recovery: "Recovery",
      revenueRecovered: "Recovered revenue",
      responseRate: "Response rate",
    },
  },
  id: "heatflow",
  industry: {
    description: "Heating and home services reception and recovery workflow configuration.",
    key: "heating",
    name: "Heating",
    terminology: ["boiler", "heating", "hot water", "heat pump", "engineer"],
  },
  knowledgeBase: {
    businessRules: [
      "Never advise unsafe heating repairs.",
      "Boiler failures and no heating require immediate safety escalation.",
      "Avoid exact pricing promises unless the job has been assessed.",
      "Always ask for postcode, access notes, and property type for visit planning.",
    ],
    entityCatalog: leadEntityDefinitions,
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
      "Let's get the right engineer lined up.",
      "Thank you. I've made a note.",
    ],
  },
  notifications: [
    { channel: "dashboard", key: "call-summary-ready", template: "Show the summary on the live dashboard as soon as the call is captured.", trigger: "call.summary.created" },
    { channel: "sms", key: "missed-call-recovery", template: "Send the missed call recovery SMS from the active profile.", trigger: "call.missed" },
    { channel: "email", key: "safety-escalation", template: "Email the team when a heating safety issue is captured.", trigger: "lead.escalated" },
  ],
  workflows: [
    { channel: "voice", description: "Answer the call with a warm heating receptionist greeting.", handler: "handleHeatFlowVoiceWebhook", key: "answer-inbound-call", label: "Answer inbound call", profileId: "heatflow", status: "active", trigger: "inbound_call_completed" },
    { channel: "workflow", description: "Collect speech input and continue the triage conversation.", handler: "handleHeatFlowVoiceSpeechWebhook", key: "continue-voice-conversation", label: "Continue conversation", profileId: "heatflow", status: "active", trigger: "message_received" },
    { channel: "sms", description: "Send a missed-call recovery SMS and keep the recovery workflow moving.", handler: "sendHeatFlowRecoverySms", key: "send-missed-call-recovery", label: "Send recovery SMS", profileId: "heatflow", status: "active", trigger: "missed_call" },
    { channel: "workflow", description: "Create or update the lead record and recovery workflow.", handler: "processHeatFlowCallWebhook", key: "persist-call", label: "Persist call", profileId: "heatflow", status: "active", trigger: "new_lead_created" },
    { channel: "workflow", description: "Generate the receptionist summary for the dashboard.", handler: "generateHeatFlowCallSummary", key: "generate-call-summary", label: "Generate summary", profileId: "heatflow", status: "active", trigger: "follow_up_due" },
  ],
} as const);
