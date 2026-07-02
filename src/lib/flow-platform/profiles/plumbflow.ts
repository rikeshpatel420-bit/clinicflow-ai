import { defineFlowPlatformProfile } from "../factory";
import type { FlowPlatformProfile } from "../types";

export type PlumbFlowVoiceIntent =
  | "emergency_leak"
  | "burst_pipe"
  | "boiler_issue"
  | "blocked_drain"
  | "no_hot_water"
  | "underfloor_heating"
  | "bathroom_quote"
  | "kitchen_plumbing"
  | "gas_smell_safety"
  | "routine_service"
  | "quote_request"
  | "other_unclear";

export type PlumbFlowActionIntent =
  | "leak"
  | "burst_pipe"
  | "boiler"
  | "blocked_drain"
  | "hot_water"
  | "underfloor_heating"
  | "bathroom_quote"
  | "kitchen_plumbing"
  | "gas_safety"
  | "routine_service"
  | "quote_request"
  | "other";

export type PlumbFlowLeadIntent =
  | "new_job"
  | "emergency_repair"
  | "boiler_issue"
  | "drainage_issue"
  | "quote_request"
  | "routine_service"
  | "gas_safety"
  | "general_admin";

type PlumbFlowVoiceEntity = "address" | "email" | "fullName" | "phoneNumber" | "postcode" | "preferredVisitTime";
type PlumbFlowLeadEntity =
  | "accessNotes"
  | "address"
  | "appointmentPreference"
  | "asset"
  | "customerType"
  | "email"
  | "equipment"
  | "fullName"
  | "issue"
  | "photosRequested"
  | "phone"
  | "postcode"
  | "propertyType"
  | "preferredVisitTime"
  | "urgency";

const summaryTemplates = {
  appointmentRecommendation: "Offer the earliest available engineer visit or callback and confirm access details.",
  caseSummary: "No safety red flags detected. Continue routine plumbing triage.",
  followUpRecommendation: "Send the callback or quote summary and monitor for response.",
  patientSummary: "Customer summary pending.",
  receptionNotes: "Reception notes pending.",
  sms: "Hi, thanks for contacting PlumbFlow. Sorry we missed you. Reply YES and we'll call you back.",
  email: "Thanks for contacting PlumbFlow. The team will review your request and follow up shortly.",
};

const voiceIntentDefinitions = [
  {
    intent: "emergency_leak" as const,
    label: "Emergency leak",
    keywords: ["leak", "leaking", "water coming through", "dripping", "urgent leak", "emergency leak"],
    followUpQuestion: "I'm sorry you're dealing with that. Is the leak active right now, and do you know where it's coming from?",
    priority: 5,
    summaryHint: "Treat as urgent and gather the exact location and severity.",
    escalate: true,
  },
  {
    intent: "burst_pipe" as const,
    label: "Burst pipe",
    keywords: ["burst pipe", "pipe burst", "burst", "flooding", "water pouring"],
    followUpQuestion: "I'm sorry - that sounds urgent. Is the water still running, and can you switch it off safely?",
    priority: 5,
    summaryHint: "Urgent same-day response required.",
    escalate: true,
  },
  {
    intent: "boiler_issue" as const,
    label: "Boiler issue",
    keywords: ["boiler", "no hot water", "heating not working", "boiler pressure", "pilot light"],
    followUpQuestion: "Of course. What seems to be happening with the boiler, and is there any hot water at all?",
    priority: 4,
    summaryHint: "Capture boiler symptoms and arrange a callback or visit.",
  },
  {
    intent: "blocked_drain" as const,
    label: "Blocked drain",
    keywords: ["blocked drain", "blocked toilet", "blocked sink", "drainage", "slow drain", "gurgling"],
    followUpQuestion: "Certainly. Is it a kitchen, bathroom, or outdoor drain, and is it backing up badly?",
    priority: 4,
    summaryHint: "Capture the blockage location and any overflow risk.",
  },
  {
    intent: "no_hot_water" as const,
    label: "No hot water",
    keywords: ["no hot water", "hot water gone", "water not heating", "hot water issue"],
    followUpQuestion: "Understood. When did it start, and is the heating affected as well?",
    priority: 3,
    summaryHint: "Gather heating and hot-water context.",
  },
  {
    intent: "underfloor_heating" as const,
    label: "Underfloor heating",
    keywords: ["underfloor heating", "ufh", "floor heating"],
    followUpQuestion: "Absolutely. What's happening with the heating, and which part of the property is affected?",
    priority: 3,
    summaryHint: "Capture the system type and affected area.",
  },
  {
    intent: "bathroom_quote" as const,
    label: "Bathroom quote",
    keywords: ["bathroom quote", "bathroom", "bathroom install", "bathroom plumbing"],
    followUpQuestion: "Of course. Could I have your postcode and a preferred time for the team to take a look?",
    priority: 2,
    summaryHint: "Capture the scope and visit availability.",
  },
  {
    intent: "kitchen_plumbing" as const,
    label: "Kitchen plumbing",
    keywords: ["kitchen plumbing", "sink", "tap", "dishwasher", "kitchen leak"],
    followUpQuestion: "Certainly. What is happening in the kitchen, and is there a leak or blockage right now?",
    priority: 3,
    summaryHint: "Capture the fixture and whether the problem is active.",
  },
  {
    intent: "gas_smell_safety" as const,
    label: "Gas safety",
    keywords: ["gas smell", "smell gas", "gas leak", "carbon monoxide", "gas safety"],
    followUpQuestion: "I'm sorry - that needs immediate attention. Is everyone safe and out of danger right now?",
    priority: 5,
    summaryHint: "Treat as the highest safety priority and escalate immediately.",
    escalate: true,
  },
  {
    intent: "routine_service" as const,
    label: "Routine service",
    keywords: ["service", "maintenance", "annual service", "check", "routine"],
    followUpQuestion: "Of course. Could I have your postcode and the best time for the team to call you back?",
    priority: 2,
    summaryHint: "Capture the routine service request and preferred visit time.",
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "price", "cost", "how much"],
    followUpQuestion: "Absolutely. Could I have your postcode, the issue, and the best number for the team to contact you on?",
    priority: 2,
    summaryHint: "Capture the request and arrange a quotation callback.",
  },
  {
    intent: "other_unclear" as const,
    label: "Other or unclear",
    keywords: ["other", "unsure", "unknown"],
    followUpQuestion: "No problem. Could you tell me a little more so I can route you properly?",
    priority: 1,
    summaryHint: "Ask one simple clarification question.",
  },
] satisfies FlowPlatformProfile<PlumbFlowVoiceIntent, PlumbFlowVoiceEntity, PlumbFlowActionIntent, PlumbFlowLeadIntent, PlumbFlowLeadEntity>["conversation"]["voice"]["intentDefinitions"];

const leadIntentDefinitions = [
  {
    intent: "new_job" as const,
    label: "New job enquiry",
    keywords: ["new job", "need a plumber", "call out", "book a plumber", "plumbing help"],
    followUpQuestion: "Could I have your name, phone number, postcode, and a brief description of the issue?",
    priority: 2,
    summaryHint: "Capture the new enquiry details and preferred contact time.",
  },
  {
    intent: "emergency_repair" as const,
    label: "Emergency repair",
    keywords: ["emergency", "urgent", "flooding", "burst pipe", "leak", "water everywhere"],
    followUpQuestion: "I'm sorry that's happening. Is the water still active, and can you tell me your postcode?",
    priority: 5,
    summaryHint: "Escalate immediately and capture exact location details.",
    escalate: true,
  },
  {
    intent: "boiler_issue" as const,
    label: "Boiler issue",
    keywords: ["boiler", "heating", "no hot water", "pressure", "pilot light"],
    followUpQuestion: "Could I have your postcode, the boiler symptoms, and a good time for the team to call you back?",
    priority: 4,
    summaryHint: "Arrange a heating callback or visit.",
  },
  {
    intent: "drainage_issue" as const,
    label: "Drainage issue",
    keywords: ["drain", "blocked", "toilet", "sink", "drainage"],
    followUpQuestion: "Could I have your postcode and a quick note about which drain or fixture is affected?",
    priority: 3,
    summaryHint: "Gather the blocked fixture and any overflow risk.",
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "bathroom quote", "kitchen quote", "cost"],
    followUpQuestion: "Could I have your postcode, property type, and preferred visit time for the quotation?",
    priority: 2,
    summaryHint: "Capture the job scope and visit window.",
  },
  {
    intent: "routine_service" as const,
    label: "Routine service",
    keywords: ["service", "maintenance", "annual service", "routine"],
    followUpQuestion: "Certainly. Could I have your postcode and the best time for the engineer to call?",
    priority: 2,
    summaryHint: "Capture the service request and availability.",
  },
  {
    intent: "gas_safety" as const,
    label: "Gas safety",
    keywords: ["gas smell", "smell gas", "gas leak", "carbon monoxide"],
    followUpQuestion: "This needs immediate attention. Are you safe right now and can you leave the property if needed?",
    priority: 5,
    summaryHint: "Prioritise safety and immediate human escalation.",
    escalate: true,
  },
  {
    intent: "general_admin" as const,
    label: "General administration",
    keywords: ["admin", "question", "message", "callback", "office"],
    followUpQuestion: "Of course. Could you tell me a little more so I can route this properly?",
    priority: 1,
    summaryHint: "Route to the office with a calm callback.",
  },
] satisfies FlowPlatformProfile<PlumbFlowVoiceIntent, PlumbFlowVoiceEntity, PlumbFlowActionIntent, PlumbFlowLeadIntent, PlumbFlowLeadEntity>["conversation"]["leads"]["intentDefinitions"];

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
    patterns: [/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
  },
  {
    entity: "accessNotes" as const,
    label: "Access notes",
    patterns: [/(?:access|parking|gate|key|dog|bell|entry|leave with)\s+(.+)/i],
  },
  {
    entity: "photosRequested" as const,
    label: "Photos requested",
    patterns: [/(photo|photos|picture|pictures|send a photo|send photos)/i],
  },
  {
    entity: "customerType" as const,
    label: "Customer type",
    patterns: [/(new|existing|returning|private|commercial|landlord|tenant|renter|owner)/i],
  },
] satisfies FlowPlatformProfile<PlumbFlowVoiceIntent, PlumbFlowVoiceEntity, PlumbFlowActionIntent, PlumbFlowLeadIntent, PlumbFlowLeadEntity>["conversation"]["leads"]["entityDefinitions"];

const actionDefinitions = [
  {
    intent: "leak" as const,
    label: "Leak",
    keywords: ["leak", "leaking", "drip", "dripping", "water leak"],
    followUpQuestion: "I'm sorry you're dealing with that. Is the leak active right now, and where is it coming from?",
    priority: 5,
    summaryHint: "Capture the source, severity, and whether water is still active.",
    escalate: true,
  },
  {
    intent: "burst_pipe" as const,
    label: "Burst pipe",
    keywords: ["burst pipe", "burst", "flooding", "pipe burst"],
    followUpQuestion: "Is the water still running, and have you been able to shut it off safely?",
    priority: 5,
    summaryHint: "Urgent same-day response required.",
    escalate: true,
  },
  {
    intent: "boiler" as const,
    label: "Boiler",
    keywords: ["boiler", "heating", "no hot water", "pressure", "pilot light"],
    followUpQuestion: "Certainly. What seems to be happening with the boiler, and when did it start?",
    priority: 4,
    summaryHint: "Gather boiler symptoms and arrange a callback.",
  },
  {
    intent: "blocked_drain" as const,
    label: "Blocked drain",
    keywords: ["blocked drain", "blocked toilet", "blocked sink", "drainage", "slow drain"],
    followUpQuestion: "Of course. Is it affecting a sink, toilet, or shower, and is it backing up badly?",
    priority: 4,
    summaryHint: "Capture the blockage location and overflow risk.",
  },
  {
    intent: "hot_water" as const,
    label: "No hot water",
    keywords: ["no hot water", "hot water gone", "water not heating"],
    followUpQuestion: "Understood. Is the heating affected too, or is it only the hot water?",
    priority: 3,
    summaryHint: "Capture heating context and availability.",
  },
  {
    intent: "underfloor_heating" as const,
    label: "Underfloor heating",
    keywords: ["underfloor heating", "ufh", "floor heating"],
    followUpQuestion: "Absolutely. Which area is affected and what exactly is happening?",
    priority: 3,
    summaryHint: "Capture system type and affected area.",
  },
  {
    intent: "bathroom_quote" as const,
    label: "Bathroom quote",
    keywords: ["bathroom quote", "bathroom", "bathroom install", "bathroom plumbing"],
    followUpQuestion: "Could I have your postcode and a preferred time for the team to take a look?",
    priority: 2,
    summaryHint: "Capture the job scope and visit window.",
  },
  {
    intent: "kitchen_plumbing" as const,
    label: "Kitchen plumbing",
    keywords: ["kitchen plumbing", "sink", "tap", "dishwasher", "kitchen leak"],
    followUpQuestion: "Certainly. What is happening in the kitchen, and is it a leak or a blockage?",
    priority: 3,
    summaryHint: "Capture the fixture and whether the issue is active.",
  },
  {
    intent: "gas_safety" as const,
    label: "Gas safety",
    keywords: ["gas smell", "smell gas", "gas leak", "carbon monoxide"],
    followUpQuestion: "I'm sorry, but that needs immediate attention. Are you and everyone else safe right now?",
    priority: 5,
    summaryHint: "Treat as the highest safety priority.",
    escalate: true,
  },
  {
    intent: "routine_service" as const,
    label: "Routine service",
    keywords: ["service", "maintenance", "annual service", "routine"],
    followUpQuestion: "Of course. Could I have your postcode and the best time for a callback?",
    priority: 2,
    summaryHint: "Capture routine service details.",
  },
  {
    intent: "quote_request" as const,
    label: "Quote request",
    keywords: ["quote", "estimate", "price", "cost", "how much"],
    followUpQuestion: "Absolutely. Could I have your postcode, the issue, and the best contact number?",
    priority: 2,
    summaryHint: "Capture the request and preferred contact time.",
  },
  {
    intent: "other" as const,
    label: "Other",
    keywords: ["other", "general", "question"],
    followUpQuestion: "Of course. Could you tell me a little more so I can help properly?",
    priority: 1,
    summaryHint: "Ask for a little more context.",
  },
] satisfies FlowPlatformProfile<PlumbFlowVoiceIntent, PlumbFlowVoiceEntity, PlumbFlowActionIntent, PlumbFlowLeadIntent, PlumbFlowLeadEntity>["conversation"]["voice"]["actionDefinitions"];

export const plumbFlowPlatformProfile = defineFlowPlatformProfile({
  clinic: {
    appointmentRules: [
      "Offer the earliest available engineer visit and confirm access details.",
      "Check postcode, property type, and access notes before promising an appointment.",
      "Keep safety-first language for gas smell and severe leak situations.",
    ],
    businessHours: "Monday to Saturday, 8:00am to 6:00pm",
    locale: "en-GB",
    name: "PlumbFlow Plumbing",
    region: "United Kingdom",
    branding: {
      accent: "blue",
      background: "#eef3fb",
      icon: "wrench",
      logoText: "PF",
      primary: "#10233f",
      secondary: "#1f6feb",
      surface: "#ffffff",
      text: "#182235",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["emergency_repair", "gas_safety"],
      escalationRules: [
        "Emergency leaks and gas safety issues should escalate immediately.",
        "Never advise unsafe repairs or ignore signs of active flooding.",
        "Always allow a human plumber to take over if the caller asks.",
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
          body: "Thanks for contacting PlumbFlow Plumbing. The team will review your request and follow up shortly.",
          subject: "PlumbFlow Plumbing follow-up",
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
        "Gas smell or suspected gas leak is the highest safety priority.",
        "Burst pipes and active flooding should score highest after gas safety.",
        "Quotes and routine services are lower urgency unless the caller mentions active damage.",
      ],
    },
    voice: {
      actionDefinitions,
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, practical, and reassuring.",
      emergencyPrompt: "If you smell gas or suspect a dangerous leak, advise the caller to leave the property if safe, avoid switches or flames, and contact the emergency gas service or 999.",
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
      escalationIntents: ["gas_smell_safety", "emergency_leak"],
      escalationRules: [
        "Gas smell or suspected gas leak should escalate immediately.",
        "Active flooding or a burst pipe should transfer to a human quickly.",
        "Always offer a receptionist or engineer callback if requested.",
      ],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to PlumbFlow, and I can help with leaks, boiler issues, blocked drains, quotes, and urgent plumbing problems. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["leak", "boiler", "drain", "quote", "engineer", "property", "call-out"],
      language: "en-GB",
      pronunciations: [
        { sayAs: "PlumbFlow", term: "PlumbFlow" },
        { sayAs: "boiler", term: "boiler" },
      ],
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
        "Gas smell is the highest emergency priority.",
        "Active leaks or burst pipes should be treated as urgent.",
        "Quotes and routine servicing are lower priority unless there is active damage.",
      ],
      templates: {
        email: {
          body: "Thanks. We've made a note and the team will follow up shortly.",
          subject: "PlumbFlow Plumbing call follow-up",
        },
        sms: {
          help: "Thanks. I've made a note and a member of the team will review it shortly.",
          missedCallRecovery: "Hi, thanks for calling PlumbFlow. Sorry we missed you. Reply YES and we'll call you back.",
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      conversationTone: "warm, professional, confident, calm, friendly, British, practical",
      voice: "Polly.Brian-Neural",
    },
  },
  dashboard: {
    colors: {
      background: "#eef3fb",
      primary: "#10233f",
      secondary: "#1f6feb",
      surface: "#ffffff",
      text: "#182235",
    },
    icons: ["wrench", "droplets", "calendar-check", "message-square", "shield-alert"],
    labels: {
      activeCalls: "Active calls",
      followUp: "Follow-up queue",
      missedCalls: "Missed calls",
      recovery: "Recovery",
      revenueRecovered: "Recovered revenue",
      responseRate: "Response rate",
    },
  },
  id: "plumbflow",
  industry: {
    description: "Plumbing and home services reception and recovery workflow configuration.",
    key: "plumbing",
    name: "Plumbing",
    terminology: ["leak", "boiler", "drain", "quote", "engineer", "property", "visit"],
  },
  knowledgeBase: {
    businessRules: [
      "Never advise unsafe repairs.",
      "Gas smell or suspected gas leak requires immediate safety advice and human escalation.",
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
    { channel: "email", key: "safety-escalation", template: "Email the team when a gas safety or emergency repair issue is captured.", trigger: "lead.escalated" },
  ],
  workflows: [
    { channel: "voice", description: "Answer the call with a warm plumbing receptionist greeting.", handler: "handlePlumbFlowVoiceWebhook", key: "answer-inbound-call", label: "Answer inbound call", profileId: "plumbflow", status: "active", trigger: "inbound_call_completed" },
    { channel: "workflow", description: "Collect speech input and continue the triage conversation.", handler: "handlePlumbFlowVoiceSpeechWebhook", key: "continue-voice-conversation", label: "Continue conversation", profileId: "plumbflow", status: "active", trigger: "message_received" },
    { channel: "sms", description: "Send a missed-call recovery SMS and keep the recovery workflow moving.", handler: "sendPlumbFlowRecoverySms", key: "send-missed-call-recovery", label: "Send recovery SMS", profileId: "plumbflow", status: "active", trigger: "missed_call" },
    { channel: "workflow", description: "Create or update the lead record and recovery workflow.", handler: "processPlumbFlowCallWebhook", key: "persist-call", label: "Persist call", profileId: "plumbflow", status: "active", trigger: "new_lead_created" },
    { channel: "workflow", description: "Generate the receptionist summary for the dashboard.", handler: "generatePlumbFlowCallSummary", key: "generate-call-summary", label: "Generate summary", profileId: "plumbflow", status: "active", trigger: "follow_up_due" },
  ],
} satisfies FlowPlatformProfile<PlumbFlowVoiceIntent, PlumbFlowVoiceEntity, PlumbFlowActionIntent, PlumbFlowLeadIntent, PlumbFlowLeadEntity>);



