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

export type EstateFlowVoiceIntent =
  | "valuation_request"
  | "viewing_booking"
  | "property_enquiry"
  | "maintenance_issue"
  | "tenant_question"
  | "seller_callback"
  | "buyer_callback"
  | "offer_follow_up"
  | "rent_question"
  | "other_unclear";

export type EstateFlowActionIntent =
  | "valuation"
  | "viewing"
  | "property"
  | "maintenance"
  | "tenant"
  | "seller"
  | "buyer"
  | "offer"
  | "rent"
  | "other";

export type EstateFlowLeadIntent =
  | "valuation_request"
  | "viewing_booking"
  | "property_enquiry"
  | "maintenance_issue"
  | "tenant_question"
  | "seller_callback"
  | "buyer_callback"
  | "rent_question"
  | "offer_follow_up"
  | "general_admin";

type EstateFlowVoiceEntity =
  | StandardContactVoiceEntity
  | "budget"
  | "moveDate"
  | "propertyType"
  | "tenancyType"
  | "viewingTime"
  | "accessNotes";

type EstateFlowLeadEntity =
  | StandardContactLeadEntity
  | "accessNotes"
  | "appointmentPreference"
  | "budget"
  | "customerType"
  | "issue"
  | "moveDate"
  | "preferredVisitTime"
  | "propertyType"
  | "tenancyType"
  | "urgency"
  | "viewingTime";

const voiceIntentDefinitions = [
  {
    intent: "valuation_request" as const,
    label: "Valuation request",
    keywords: ["valuation", "value my home", "market appraisal", "selling"],
    followUpQuestion: "Of course. Could I have the property address and the best time for a callback?",
    priority: 3,
    summaryHint: "Capture the property details and preferred callback time.",
  },
  {
    intent: "viewing_booking" as const,
    label: "Viewing booking",
    keywords: ["viewing", "book a viewing", "appointment", "property viewing"],
    followUpQuestion: "Absolutely. Which property are you interested in, and when would you like to view it?",
    priority: 2,
    summaryHint: "Capture the property and viewing preference.",
  },
  {
    intent: "property_enquiry" as const,
    label: "Property enquiry",
    keywords: ["property", "house", "flat", "apartment", "for sale", "to let"],
    followUpQuestion: "Certainly. Which property are you calling about, and what would you like to know?",
    priority: 2,
    summaryHint: "Capture the property and the enquiry detail.",
  },
  {
    intent: "maintenance_issue" as const,
    label: "Maintenance issue",
    keywords: ["maintenance", "repair", "broken", "leak", "issue", "problem"],
    followUpQuestion: "I'm sorry to hear that. Is anyone at risk, or is it a routine repair?",
    priority: 4,
    summaryHint: "Capture the issue and urgency clearly.",
    escalate: true,
  },
  {
    intent: "tenant_question" as const,
    label: "Tenant question",
    keywords: ["tenant", "tenancy", "landlord", "deposit", "contract"],
    followUpQuestion: "Of course. Could I have the property address and a brief note about the question?",
    priority: 2,
    summaryHint: "Capture the tenancy detail and the callback need.",
  },
  {
    intent: "seller_callback" as const,
    label: "Seller callback",
    keywords: ["seller", "selling", "list my home", "market my home"],
    followUpQuestion: "Certainly. Could I have the property address and the best time to reach you?",
    priority: 2,
    summaryHint: "Capture the seller details and callback window.",
  },
  {
    intent: "buyer_callback" as const,
    label: "Buyer callback",
    keywords: ["buyer", "buying", "offer", "purchasing"],
    followUpQuestion: "Of course. Which property or area are you interested in, and when should the team call you back?",
    priority: 2,
    summaryHint: "Capture the buyer details and callback window.",
  },
  {
    intent: "offer_follow_up" as const,
    label: "Offer follow-up",
    keywords: ["offer", "accepted", "counter offer", "follow up"],
    followUpQuestion: "Certainly. Could I have the address and a quick note on the offer update?",
    priority: 2,
    summaryHint: "Capture the offer status and next action.",
  },
  {
    intent: "rent_question" as const,
    label: "Rent question",
    keywords: ["rent", "payment", "arrears", "tenancy", "direct debit"],
    followUpQuestion: "Of course. Could I have the property address and a brief note about the rent issue?",
    priority: 3,
    summaryHint: "Capture the rent question and the tenant context.",
  },
  {
    intent: "other_unclear" as const,
    label: "Other or unclear",
    keywords: ["other", "unsure", "unknown"],
    followUpQuestion: "No problem. Could you tell me a little more so I can help properly?",
    priority: 1,
    summaryHint: "Ask for one simple clarification.",
  },
] satisfies FlowPlatformProfile<EstateFlowVoiceIntent, EstateFlowVoiceEntity, EstateFlowActionIntent, EstateFlowLeadIntent, EstateFlowLeadEntity>["conversation"]["voice"]["intentDefinitions"];

const leadIntentDefinitions = [
  {
    intent: "valuation_request" as const,
    label: "Valuation request",
    keywords: ["valuation", "market appraisal", "selling", "value my home"],
    followUpQuestion: "Could I have the address and a good time for the valuation team to call?",
    priority: 3,
    summaryHint: "Capture the property details and callback preference.",
  },
  {
    intent: "viewing_booking" as const,
    label: "Viewing booking",
    keywords: ["viewing", "book a viewing", "appointment", "property viewing"],
    followUpQuestion: "Could I have your name, phone number, and the property you want to view?",
    priority: 2,
    summaryHint: "Capture the property and viewing preference.",
  },
  {
    intent: "property_enquiry" as const,
    label: "Property enquiry",
    keywords: ["property", "house", "flat", "apartment"],
    followUpQuestion: "Could I have the address and a brief note about the enquiry?",
    priority: 2,
    summaryHint: "Capture the property and enquiry detail.",
  },
  {
    intent: "maintenance_issue" as const,
    label: "Maintenance issue",
    keywords: ["maintenance", "repair", "broken", "leak", "issue", "problem"],
    followUpQuestion: "Is anyone at risk, or is it a routine repair?",
    priority: 4,
    summaryHint: "Capture the issue and urgency clearly.",
    escalate: true,
  },
  {
    intent: "tenant_question" as const,
    label: "Tenant question",
    keywords: ["tenant", "tenancy", "landlord", "deposit", "contract"],
    followUpQuestion: "Could I have the property address and a brief note about the question?",
    priority: 2,
    summaryHint: "Capture the tenancy detail and the callback need.",
  },
  {
    intent: "seller_callback" as const,
    label: "Seller callback",
    keywords: ["seller", "selling", "list my home", "market my home"],
    followUpQuestion: "Could I have the property address and the best time to reach you?",
    priority: 2,
    summaryHint: "Capture the seller details and callback window.",
  },
  {
    intent: "buyer_callback" as const,
    label: "Buyer callback",
    keywords: ["buyer", "buying", "offer", "purchasing"],
    followUpQuestion: "Could I have the property or area and a good callback time?",
    priority: 2,
    summaryHint: "Capture the buyer details and callback window.",
  },
  {
    intent: "offer_follow_up" as const,
    label: "Offer follow-up",
    keywords: ["offer", "accepted", "counter offer", "follow up"],
    followUpQuestion: "Could I have the address and a quick note on the offer update?",
    priority: 2,
    summaryHint: "Capture the offer status and next action.",
  },
  {
    intent: "rent_question" as const,
    label: "Rent question",
    keywords: ["rent", "payment", "arrears", "tenancy", "direct debit"],
    followUpQuestion: "Could I have the property address and a brief note about the rent issue?",
    priority: 3,
    summaryHint: "Capture the rent question and the tenant context.",
  },
  {
    intent: "general_admin" as const,
    label: "General administration",
    keywords: ["admin", "question", "message", "callback"],
    followUpQuestion: "Of course. Could you tell me a little more so I can route this properly?",
    priority: 1,
    summaryHint: "Route to the office with a calm callback.",
  },
] satisfies FlowPlatformProfile<EstateFlowVoiceIntent, EstateFlowVoiceEntity, EstateFlowActionIntent, EstateFlowLeadIntent, EstateFlowLeadEntity>["conversation"]["leads"]["intentDefinitions"];

const voiceEntityDefinitions = [
  ...createStandardContactVoiceEntities(),
  {
    entity: "propertyType" as const,
    label: "Property type",
    patterns: [/(house|flat|apartment|bungalow|commercial|office|rental|detached|semi-detached|terraced)/i],
  },
  {
    entity: "tenancyType" as const,
    label: "Tenancy type",
    patterns: [/(freehold|leasehold|assured shorthold|rental|tenancy|owner occupied|commercial lease)/i],
  },
  {
    entity: "budget" as const,
    label: "Budget",
    patterns: [/(?:budget|price|cost|how much)\s+(?:of|around|up to)?\s*£?(\d[\d,]*)/i],
  },
  {
    entity: "moveDate" as const,
    label: "Move date",
    patterns: [/(?:move|moving|exchange|completion)(?:\s+date)?\s+([a-z0-9,\s-]+)/i],
  },
  {
    entity: "viewingTime" as const,
    label: "Viewing time",
    patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i],
  },
  {
    entity: "accessNotes" as const,
    label: "Access notes",
    patterns: [/(?:access notes|access|parking|entry)\s+(.+)/i],
  },
] satisfies FlowPlatformProfile<EstateFlowVoiceIntent, EstateFlowVoiceEntity, EstateFlowActionIntent, EstateFlowLeadIntent, EstateFlowLeadEntity>["conversation"]["voice"]["entityDefinitions"];

const leadEntityDefinitions = [
  ...createStandardContactLeadEntities(),
  {
    entity: "customerType" as const,
    label: "Customer type",
    patterns: [/(buyer|seller|tenant|landlord|homeowner|developer|agent|investor)/i],
  },
  {
    entity: "propertyType" as const,
    label: "Property type",
    patterns: [/(house|flat|apartment|bungalow|commercial|office|rental|detached|semi-detached|terraced)/i],
  },
  {
    entity: "tenancyType" as const,
    label: "Tenancy type",
    patterns: [/(freehold|leasehold|assured shorthold|rental|tenancy|owner occupied|commercial lease)/i],
  },
  {
    entity: "budget" as const,
    label: "Budget",
    patterns: [/(?:budget|price|cost|how much)\s+(?:of|around|up to)?\s*£?(\d[\d,]*)/i],
  },
  {
    entity: "moveDate" as const,
    label: "Move date",
    patterns: [/(?:move|moving|exchange|completion)(?:\s+date)?\s+([a-z0-9,\s-]+)/i],
  },
  {
    entity: "viewingTime" as const,
    label: "Viewing time",
    patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i],
  },
  {
    entity: "accessNotes" as const,
    label: "Access notes",
    patterns: [/(?:access notes|access|parking|entry)\s+(.+)/i],
  },
] satisfies FlowPlatformProfile<EstateFlowVoiceIntent, EstateFlowVoiceEntity, EstateFlowActionIntent, EstateFlowLeadIntent, EstateFlowLeadEntity>["conversation"]["leads"]["entityDefinitions"];

const actionDefinitions = [
  { intent: "valuation" as const, label: "Valuation", keywords: ["valuation", "market appraisal", "selling"], followUpQuestion: "Could I have the property address and a good time for the team to call?", priority: 3, summaryHint: "Capture the property details and callback preference." },
  { intent: "viewing" as const, label: "Viewing", keywords: ["viewing", "book a viewing", "appointment"], followUpQuestion: "Which property are you interested in, and when would you like to view it?", priority: 2, summaryHint: "Capture the property and viewing preference." },
  { intent: "property" as const, label: "Property enquiry", keywords: ["property", "house", "flat"], followUpQuestion: "Which property are you calling about, and what would you like to know?", priority: 2, summaryHint: "Capture the property and enquiry detail." },
  { intent: "maintenance" as const, label: "Maintenance issue", keywords: ["maintenance", "repair", "broken", "leak"], followUpQuestion: "Is anyone at risk, or is it a routine repair?", priority: 4, summaryHint: "Capture the issue and urgency clearly.", escalate: true },
  { intent: "tenant" as const, label: "Tenant question", keywords: ["tenant", "tenancy", "landlord"], followUpQuestion: "Could I have the property address and a brief note about the question?", priority: 2, summaryHint: "Capture the tenancy detail and the callback need." },
  { intent: "seller" as const, label: "Seller callback", keywords: ["seller", "selling", "list my home"], followUpQuestion: "Could I have the property address and the best time to reach you?", priority: 2, summaryHint: "Capture the seller details and callback window." },
  { intent: "buyer" as const, label: "Buyer callback", keywords: ["buyer", "buying", "offer"], followUpQuestion: "Could I have the property or area and a good callback time?", priority: 2, summaryHint: "Capture the buyer details and callback window." },
  { intent: "offer" as const, label: "Offer follow-up", keywords: ["offer", "accepted", "counter offer"], followUpQuestion: "Could I have the address and a quick note on the offer update?", priority: 2, summaryHint: "Capture the offer status and next action." },
  { intent: "rent" as const, label: "Rent question", keywords: ["rent", "payment", "arrears"], followUpQuestion: "Could I have the property address and a brief note about the rent issue?", priority: 3, summaryHint: "Capture the rent question and the tenant context." },
  { intent: "other" as const, label: "Other", keywords: ["other", "general", "question"], followUpQuestion: "Could you tell me a little more so I can help properly?", priority: 1, summaryHint: "Ask for one simple clarification." },
] satisfies FlowPlatformProfile<EstateFlowVoiceIntent, EstateFlowVoiceEntity, EstateFlowActionIntent, EstateFlowLeadIntent, EstateFlowLeadEntity>["conversation"]["voice"]["actionDefinitions"];

export const estateFlowPlatformProfile = createFlowPlatformProfile({
  clinic: {
    appointmentRules: [
      "Offer the earliest available callback or viewing slot and confirm the property details.",
      "Check postcode, property type, and access notes before promising a slot.",
      "Use calm language for maintenance and tenancy issues.",
    ],
    businessHours: "Monday to Saturday, 9:00am to 6:00pm",
    locale: "en-GB",
    name: "EstateFlow Property",
    region: "United Kingdom",
    branding: {
      accent: "violet",
      background: "#f8f4ff",
      icon: "home",
      logoText: "EF",
      primary: "#241a38",
      secondary: "#7c3aed",
      surface: "#ffffff",
      text: "#241a38",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["maintenance_issue"],
      escalationRules: [
        "Urgent maintenance issues should escalate immediately.",
        "Never promise a property valuation or viewing without the right details.",
        "Always offer a human callback when requested.",
      ],
      fallbackIntent: "general_admin",
      fallbackPrompt: "Could you tell me a little more so I can route this properly?",
      intentDefinitions: leadIntentDefinitions,
      recoveryRules: [
        "Use the approved callback SMS when the caller wants a follow-up.",
        "Record opt-outs and avoid repeat messaging after that point.",
        "Keep after-hours recovery warm and concise.",
      ],
      summaryTemplates: createStandardSummaryTemplates("EstateFlow Property", {
        caseSummary: "No urgent property safety issues detected. Continue the estate triage professionally.",
      }),
      templates: createStandardMessageTemplates("EstateFlow Property"),
      businessHoursPrompt: "Please route only urgent maintenance issues outside business hours.",
      conversationTone: "warm, calm, professional, British, practical",
      language: "en-GB",
      urgencyRules: [
        "Urgent maintenance issues are the highest priority.",
        "Valuations and viewing bookings should be handled promptly.",
        "Rent questions and offer follow-ups are lower urgency unless there is a deadline.",
      ],
    },
    voice: {
      actionDefinitions,
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, practical, and reassuring.",
      emergencyPrompt: "If there is an immediate safety issue at the property, advise the caller to stay safe and contact the appropriate emergency service if needed.",
      businessHoursPrompt: "Please route only urgent maintenance issues outside business hours.",
      entityDefinitions: voiceEntityDefinitions,
      escalationIntents: ["maintenance_issue"],
      escalationRules: [
        "Urgent maintenance issues should escalate immediately.",
        "Never promise a property valuation or viewing without the right details.",
        "Always offer a receptionist callback if requested.",
      ],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to EstateFlow, and I can help with valuations, viewings, property enquiries, maintenance issues, and tenancy questions. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["property", "valuation", "viewing", "landlord", "tenant", "estate agent"],
      language: "en-GB",
      pronunciations: [{ sayAs: "EstateFlow", term: "EstateFlow" }],
      recoveryRules: [
        "Keep callback offers warm and concise.",
        "Use voicemail for callers who cannot stay on the line.",
        "If the caller goes silent, transfer to the human fallback without delay.",
      ],
      speechRate: "96%",
      ssmlBreakMs: 220,
      ssmlEnabled: true,
      summaryTemplates: createStandardSummaryTemplates("EstateFlow Property", {
        caseSummary: "No urgent property safety issues detected. Continue the estate triage professionally.",
      }),
      urgencyRules: [
        "Urgent maintenance issues are the highest priority.",
        "Valuations and viewing bookings should be handled promptly.",
        "Rent questions and offer follow-ups are lower urgency unless there is a deadline.",
      ],
      templates: createStandardMessageTemplates("EstateFlow Property"),
      conversationTone: "warm, professional, confident, calm, friendly, British, practical",
      voice: "Polly.Amy-Neural",
    },
  },
  dashboard: {
    colors: {
      background: "#f8f4ff",
      primary: "#241a38",
      secondary: "#7c3aed",
      surface: "#ffffff",
      text: "#241a38",
    },
    icons: ["home", "calendar-check", "message-square", "shield-alert", "building-2"],
    labels: {
      activeCalls: "Active calls",
      followUp: "Follow-up queue",
      missedCalls: "Missed calls",
      recovery: "Recovery",
      revenueRecovered: "Recovered revenue",
      responseRate: "Response rate",
    },
  },
  id: "estateflow",
  industry: {
    description: "Property, letting, and estate enquiry reception workflow configuration.",
    key: "property",
    name: "Property",
    terminology: ["valuation", "viewing", "landlord", "tenant", "property"],
  },
  knowledgeBase: createStandardKnowledgeBase({
    businessRules: [
      "Never promise a valuation or viewing without the right details.",
      "Urgent maintenance issues require immediate escalation.",
      "Always ask for postcode, access notes, and property type for planning.",
      "Keep the language calm, practical, and professional.",
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
      "Let's get the right property team lined up.",
      "Thank you. I've made a note.",
    ],
  }),
  notifications: [
    { channel: "dashboard", key: "call-summary-ready", template: "Show the summary on the live dashboard as soon as the call is captured.", trigger: "call.summary.created" },
    { channel: "sms", key: "missed-call-recovery", template: "Send the missed call recovery SMS from the active profile.", trigger: "call.missed" },
    { channel: "email", key: "safety-escalation", template: "Email the team when a maintenance issue is captured.", trigger: "lead.escalated" },
  ],
  workflows: createStandardWorkflowSet({
    answerDescription: "Answer the call with a warm property receptionist greeting.",
    answerHandler: "handleEstateFlowVoiceWebhook",
    persistDescription: "Create or update the lead record and recovery workflow.",
    persistHandler: "processEstateFlowCallWebhook",
    profileName: "EstateFlow Property",
    recoveryHandler: "sendEstateFlowRecoverySms",
    summaryDescription: "Generate the receptionist summary for the dashboard.",
    summaryHandler: "generateEstateFlowCallSummary",
    speechDescription: "Collect speech input and continue the triage conversation.",
    speechHandler: "handleEstateFlowVoiceSpeechWebhook",
  }),
});
