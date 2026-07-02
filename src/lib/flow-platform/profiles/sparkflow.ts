import { defineFlowPlatformProfile } from "../factory";

export type SparkFlowVoiceIntent =
  | "power_outage"
  | "lighting_fault"
  | "consumer_unit_issue"
  | "ev_charger_fault"
  | "rewire_quote"
  | "routine_service"
  | "safety_issue"
  | "other_unclear";

export type SparkFlowActionIntent =
  | "power_outage"
  | "lighting"
  | "consumer_unit"
  | "ev_charger"
  | "rewire_quote"
  | "routine_service"
  | "safety_issue"
  | "other";

export type SparkFlowLeadIntent =
  | "new_job"
  | "safety_issue"
  | "quote_request"
  | "routine_service"
  | "general_admin";

const summaryTemplates = {
  appointmentRecommendation: "Offer the earliest engineer slot or callback and confirm access details.",
  caseSummary: "No immediate safety concerns detected. Continue electrical triage.",
  followUpRecommendation: "Send the callback summary and keep the response concise.",
  patientSummary: "Customer summary pending.",
  receptionNotes: "Reception notes pending.",
  sms: "Hi, thanks for contacting SparkFlow. Sorry we missed you. Reply YES and we'll call you back.",
  email: "Thanks for contacting SparkFlow. The team will review your request and follow up shortly.",
};

const voiceIntentDefinitions = [
  {
    intent: "power_outage" as const,
    label: "Power outage",
    keywords: ["power outage", "no power", "power off", "blackout", "no electricity"],
    followUpQuestion: "I'm sorry - is the whole property affected, and is the consumer unit accessible?",
    priority: 5,
    summaryHint: "Treat as urgent and capture the extent of the outage.",
    escalate: true,
  },
  {
    intent: "lighting_fault" as const,
    label: "Lighting fault",
    keywords: ["lights", "lighting", "fuse", "bulb", "switch", "spotlights"],
    followUpQuestion: "Of course. Is it one circuit or the whole property, and when did it start?",
    priority: 3,
    summaryHint: "Capture the affected circuit and urgency.",
  },
  {
    intent: "consumer_unit_issue" as const,
    label: "Consumer unit issue",
    keywords: ["consumer unit", "fuse box", "trip", "mcb", "rcd", "breaker"],
    followUpQuestion: "Certainly. Is it tripping repeatedly, and have you noticed any burning smell or heat?",
    priority: 5,
    summaryHint: "Prioritise safety and arrange an electrician callback.",
    escalate: true,
  },
  {
    intent: "ev_charger_fault" as const,
    label: "EV charger fault",
    keywords: ["ev charger", "car charger", "electric vehicle charger", "charging point"],
    followUpQuestion: "Absolutely. What's happening with the charger, and is it installed at home or at a business?",
    priority: 3,
    summaryHint: "Capture charger symptoms and property context.",
  },
  {
    intent: "rewire_quote" as const,
    label: "Rewire quote",
    keywords: ["rewire", "rewiring", "full rewire", "partial rewire", "quote"],
    followUpQuestion: "Of course. Could I have your postcode, property type, and a preferred time for the quote visit?",
    priority: 2,
    summaryHint: "Capture the scope and quotation window.",
  },
  {
    intent: "routine_service" as const,
    label: "Routine service",
    keywords: ["service", "maintenance", "inspection", "EICR", "test"],
    followUpQuestion: "Certainly. Could I have your postcode and the best time for the team to call you back?",
    priority: 2,
    summaryHint: "Capture the routine service request and availability.",
  },
  {
    intent: "safety_issue" as const,
    label: "Safety issue",
    keywords: ["burning smell", "spark", "smoke", "shock", "electric shock", "unsafe"],
    followUpQuestion: "I'm sorry - that needs immediate attention. Is everyone safe right now?",
    priority: 5,
    summaryHint: "Escalate immediately for safety review.",
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
] as const;

const leadIntentDefinitions = [
  {
    intent: "new_job" as const,
    label: "New job enquiry",
    keywords: ["electrician", "call out", "new job", "help with electrics"],
    followUpQuestion: "Could I have your name, phone number, postcode, and a brief description of the issue?",
    priority: 2,
    summaryHint: "Capture the new enquiry details and preferred contact time.",
  },
  {
    intent: "safety_issue" as const,
    label: "Safety issue",
    keywords: ["smoke", "spark", "shock", "burning smell", "urgent", "power outage"],
    followUpQuestion: "I'm sorry - is everyone safe, and can you tell me your postcode?",
    priority: 5,
    summaryHint: "Escalate immediately and capture exact location details.",
    escalate: true,
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "rewire", "lighting quote", "consumer unit"],
    followUpQuestion: "Could I have your postcode, property type, and the best time for the team to call you back?",
    priority: 2,
    summaryHint: "Capture the scope and visit window.",
  },
  {
    intent: "routine_service" as const,
    label: "Routine service",
    keywords: ["service", "inspection", "testing", "EICR", "maintenance"],
    followUpQuestion: "Could I have your postcode and a good time for the team to call?",
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
    patterns: [/(?:asset|item|system|equipment|charger|consumer unit|lighting)\s+(.+)/i],
  },
  {
    entity: "equipment" as const,
    label: "Equipment",
    patterns: [/(?:equipment|device|machine|charger|consumer unit)\s+(.+)/i],
  },
] as const;

const actionDefinitions = [
  { intent: "power_outage" as const, label: "Power outage", keywords: ["power outage", "no power", "blackout"], followUpQuestion: "Is the whole property affected, and is the consumer unit accessible?", priority: 5, summaryHint: "Urgent same-day response required.", escalate: true },
  { intent: "lighting" as const, label: "Lighting fault", keywords: ["lighting", "lights", "switch", "bulb"], followUpQuestion: "Is it one circuit or the whole property?", priority: 3, summaryHint: "Capture the affected circuit and urgency." },
  { intent: "consumer_unit" as const, label: "Consumer unit", keywords: ["consumer unit", "fuse box", "trip", "breaker"], followUpQuestion: "Is it tripping repeatedly, and have you noticed any burning smell or heat?", priority: 5, summaryHint: "Prioritise safety and arrange an electrician callback.", escalate: true },
  { intent: "ev_charger" as const, label: "EV charger", keywords: ["ev charger", "car charger", "charging point"], followUpQuestion: "What's happening with the charger, and is it at home or at a business?", priority: 3, summaryHint: "Capture charger symptoms and property context." },
  { intent: "rewire_quote" as const, label: "Rewire quote", keywords: ["rewire", "rewiring", "full rewire"], followUpQuestion: "Could I have your postcode, property type, and a preferred time for the quote visit?", priority: 2, summaryHint: "Capture the scope and quotation window." },
  { intent: "routine_service" as const, label: "Routine service", keywords: ["service", "maintenance", "inspection", "EICR"], followUpQuestion: "Could I have your postcode and the best time for the team to call you back?", priority: 2, summaryHint: "Capture the routine service request and availability." },
  { intent: "safety_issue" as const, label: "Safety issue", keywords: ["burning smell", "spark", "smoke", "shock"], followUpQuestion: "Is everyone safe right now?", priority: 5, summaryHint: "Escalate immediately for safety review.", escalate: true },
  { intent: "other" as const, label: "Other", keywords: ["other", "general", "question"], followUpQuestion: "Could you tell me a little more so I can help properly?", priority: 1, summaryHint: "Ask for one simple clarification." },
] as const;

export const sparkFlowPlatformProfile = defineFlowPlatformProfile({
  clinic: {
    appointmentRules: [
      "Offer the earliest available electrician visit and confirm access details.",
      "Check postcode, property type, and safety symptoms before promising a slot.",
      "Use safety-first language for power outages and burning smell situations.",
    ],
    businessHours: "Monday to Saturday, 8:00am to 6:00pm",
    locale: "en-GB",
    name: "SparkFlow Electrical",
    region: "United Kingdom",
    branding: {
      accent: "amber",
      background: "#fff8ef",
      icon: "zap",
      logoText: "SF",
      primary: "#2a1f0d",
      secondary: "#d97706",
      surface: "#ffffff",
      text: "#2b2417",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["safety_issue"],
      escalationRules: [
        "Safety issues and power outages should escalate immediately.",
        "Never advise unsafe electrical repairs.",
        "Always offer a human electrician if the caller asks.",
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
          body: "Thanks for contacting SparkFlow Electrical. The team will review your request and follow up shortly.",
          subject: "SparkFlow Electrical follow-up",
        },
        sms: {
          help: "Thanks for getting in touch. We'll have the team review this and reply shortly.",
          missedCallRecovery: summaryTemplates.sms,
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      businessHoursPrompt: "Please route only urgent safety issues outside business hours.",
      conversationTone: "warm, calm, professional, British, practical",
      language: "en-GB",
      urgencyRules: [
        "Power outages and burning smells are the highest safety priority.",
        "Consumer unit issues and shocks should be treated as urgent.",
        "Quotes and routine services are lower urgency unless the caller mentions active danger.",
      ],
    },
    voice: {
      actionDefinitions,
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, practical, and reassuring.",
      emergencyPrompt: "If you smell burning, suspect a serious fault, or think someone may be at risk, advise the caller to stay safe and speak to the emergency service if needed.",
      businessHoursPrompt: "Please route only urgent safety issues outside business hours.",
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
      escalationIntents: ["power_outage", "safety_issue"],
      escalationRules: [
        "Power outages and safety issues should escalate immediately.",
        "Never advise unsafe electrical repairs.",
        "Always offer a receptionist or electrician callback if requested.",
      ],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to SparkFlow, and I can help with power issues, lighting, consumer unit faults, EV chargers, and quote requests. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["electrician", "power", "lighting", "consumer unit", "EV charger", "property"],
      language: "en-GB",
      pronunciations: [{ sayAs: "SparkFlow", term: "SparkFlow" }],
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
        "Power outage and safety issues are the highest emergency priority.",
        "Consumer unit issues and shocks should score highest after safety alerts.",
        "Quotes and routine servicing are lower priority unless the caller mentions active danger.",
      ],
      templates: {
        email: {
          body: "Thanks. We've made a note and the team will follow up shortly.",
          subject: "SparkFlow Electrical call follow-up",
        },
        sms: {
          help: "Thanks. I've made a note and a member of the team will review it shortly.",
          missedCallRecovery: "Hi, thanks for calling SparkFlow. Sorry we missed you. Reply YES and we'll call you back.",
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
      background: "#fff8ef",
      primary: "#2a1f0d",
      secondary: "#d97706",
      surface: "#ffffff",
      text: "#2b2417",
    },
    icons: ["zap", "bell", "calendar-check", "message-square", "shield-alert"],
    labels: {
      activeCalls: "Active calls",
      followUp: "Follow-up queue",
      missedCalls: "Missed calls",
      recovery: "Recovery",
      revenueRecovered: "Recovered revenue",
      responseRate: "Response rate",
    },
  },
  id: "sparkflow",
  industry: {
    description: "Electrical trade reception and safety workflow configuration.",
    key: "electrical",
    name: "Electrical",
    terminology: ["power", "lighting", "consumer unit", "EV charger", "electrician"],
  },
  knowledgeBase: {
    businessRules: [
      "Never advise unsafe electrical repairs.",
      "Power outages and burning smells require immediate safety escalation.",
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
      "Let's get the right electrician lined up.",
      "Thank you. I've made a note.",
    ],
  },
  notifications: [
    { channel: "dashboard", key: "call-summary-ready", template: "Show the summary on the live dashboard as soon as the call is captured.", trigger: "call.summary.created" },
    { channel: "sms", key: "missed-call-recovery", template: "Send the missed call recovery SMS from the active profile.", trigger: "call.missed" },
    { channel: "email", key: "safety-escalation", template: "Email the team when a safety issue is captured.", trigger: "lead.escalated" },
  ],
  workflows: [
    { channel: "voice", description: "Answer the call with a warm electrical receptionist greeting.", handler: "handleSparkFlowVoiceWebhook", key: "answer-inbound-call", label: "Answer inbound call", profileId: "sparkflow", status: "active", trigger: "inbound_call_completed" },
    { channel: "workflow", description: "Collect speech input and continue the triage conversation.", handler: "handleSparkFlowVoiceSpeechWebhook", key: "continue-voice-conversation", label: "Continue conversation", profileId: "sparkflow", status: "active", trigger: "message_received" },
    { channel: "sms", description: "Send a missed-call recovery SMS and keep the recovery workflow moving.", handler: "sendSparkFlowRecoverySms", key: "send-missed-call-recovery", label: "Send recovery SMS", profileId: "sparkflow", status: "active", trigger: "missed_call" },
    { channel: "workflow", description: "Create or update the lead record and recovery workflow.", handler: "processSparkFlowCallWebhook", key: "persist-call", label: "Persist call", profileId: "sparkflow", status: "active", trigger: "new_lead_created" },
    { channel: "workflow", description: "Generate the receptionist summary for the dashboard.", handler: "generateSparkFlowCallSummary", key: "generate-call-summary", label: "Generate summary", profileId: "sparkflow", status: "active", trigger: "follow_up_due" },
  ],
} as const);
