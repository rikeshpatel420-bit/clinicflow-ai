import {
  createFlowPlatformProfile,
  createStandardContactLeadEntities,
  createStandardContactVoiceEntities,
  createStandardKnowledgeBase,
  createStandardWorkflowSet,
  type StandardContactLeadEntity,
  type StandardContactVoiceEntity,
} from "../profile-builder";
import type { FlowPlatformProfile } from "../types";

export type VetFlowVoiceIntent =
  | "emergency_pet"
  | "new_pet_appointment"
  | "existing_pet_appointment"
  | "vaccination_booking"
  | "neutering_booking"
  | "prescription_request"
  | "pricing_enquiry"
  | "complaint"
  | "message_for_reception"
  | "other_unclear";

export type VetFlowActionIntent =
  | "emergency"
  | "appointment"
  | "vaccination"
  | "neutering"
  | "prescription"
  | "pricing"
  | "complaint"
  | "message"
  | "other";

export type VetFlowLeadIntent =
  | "new_pet"
  | "emergency"
  | "vaccination"
  | "prescription_request"
  | "surgery_consult"
  | "pricing_enquiry"
  | "general_admin";

type VetFlowVoiceEntity =
  | StandardContactVoiceEntity
  | "age"
  | "breed"
  | "medication"
  | "petName"
  | "petType"
  | "preferredVisitTime"
  | "symptoms";

type VetFlowLeadEntity =
  | StandardContactLeadEntity
  | "age"
  | "appointmentPreference"
  | "breed"
  | "customerType"
  | "medication"
  | "petName"
  | "petType"
  | "preferredVisitTime"
  | "symptoms";

const summaryTemplates = {
  appointmentRecommendation: "Offer the earliest available appointment and confirm the pet's symptoms and best callback window.",
  caseSummary: "No urgent veterinary red flags detected. Continue the call calmly and gather the relevant details.",
  clinicalSummary: "No urgent veterinary red flags detected. Continue the call calmly and gather the relevant details.",
  followUpRecommendation: "Send the callback summary and keep the team aware of any urgent symptoms.",
  patientSummary: "Pet owner summary pending.",
  receptionNotes: "Reception notes pending.",
  sms: "Hi, thanks for calling VetFlow. Sorry we missed you. Reply YES and we'll call you back.",
  email: "Thanks for contacting VetFlow. The team will review your request and follow up shortly.",
};

const voiceIntentDefinitions = [
  {
    intent: "emergency_pet" as const,
    label: "Pet emergency",
    keywords: ["emergency", "urgent", "collapsed", "collapse", "not breathing", "bleeding", "poison", "poisoned", "seizure", "trauma"],
    followUpQuestion: "I'm sorry this sounds serious. Is your pet breathing normally, and are they conscious right now?",
    priority: 5,
    summaryHint: "Treat as urgent and keep the callback immediate.",
    escalate: true,
  },
  {
    intent: "new_pet_appointment" as const,
    label: "New pet appointment",
    keywords: ["new pet", "register", "join", "first appointment", "first visit"],
    followUpQuestion: "Of course. Could I have your name, mobile number, email if you'd like to share it, and a little detail about your pet?",
    priority: 3,
    summaryHint: "Capture owner details and the preferred appointment window.",
  },
  {
    intent: "existing_pet_appointment" as const,
    label: "Existing pet appointment",
    keywords: ["existing patient", "already registered", "follow-up", "review", "my pet"],
    followUpQuestion: "Certainly. Could I have your full name, mobile number, your pet's name, and the reason for calling?",
    priority: 3,
    summaryHint: "Confirm the owner and pet details for the next booking step.",
  },
  {
    intent: "vaccination_booking" as const,
    label: "Vaccination booking",
    keywords: ["vaccination", "vaccines", "booster", "jabs", "vaccination appointment"],
    followUpQuestion: "Absolutely. Could I have your pet's name and the best day or time for the team to call you back?",
    priority: 2,
    summaryHint: "Offer vaccination availability and capture the callback window.",
  },
  {
    intent: "neutering_booking" as const,
    label: "Neutering booking",
    keywords: ["neuter", "neutering", "spay", "spaying", "castrate", "castration"],
    followUpQuestion: "Of course. Could I have your pet's name, age, and a good time for the team to contact you?",
    priority: 4,
    summaryHint: "Capture the booking need and any timing considerations.",
  },
  {
    intent: "prescription_request" as const,
    label: "Prescription request",
    keywords: ["prescription", "repeat prescription", "medication", "tablets", "medicine"],
    followUpQuestion: "Certainly. Could I have your name, your pet's name, and the medication you need help with?",
    priority: 3,
    summaryHint: "Capture the repeat prescription details and any urgency.",
  },
  {
    intent: "pricing_enquiry" as const,
    label: "Pricing enquiry",
    keywords: ["price", "pricing", "cost", "fee", "how much", "charge"],
    followUpQuestion: "Absolutely. Prices can vary depending on the assessment, so please share your contact details and the team can help properly.",
    priority: 2,
    summaryHint: "Avoid quoting exact prices unless clinic knowledge confirms them.",
  },
  {
    intent: "complaint" as const,
    label: "Complaint",
    keywords: ["complaint", "angry", "upset", "not happy", "frustrated"],
    followUpQuestion: "I'm sorry that's been frustrating. Could I have your name, number, and a brief note about what happened?",
    priority: 5,
    summaryHint: "Escalate politely and capture the issue clearly.",
    escalate: true,
  },
  {
    intent: "message_for_reception" as const,
    label: "Message for reception",
    keywords: ["message", "pass on", "reception", "note", "callback"],
    followUpQuestion: "Certainly. Could I have your name, number, and the message you'd like passed on to reception?",
    priority: 1,
    summaryHint: "Take the message and hand it to reception.",
  },
  {
    intent: "other_unclear" as const,
    label: "Other or unclear",
    keywords: ["other", "unsure", "unknown"],
    followUpQuestion: "Just give me a little more detail and I'll route you to the right person.",
    priority: 1,
    summaryHint: "Ask a simple clarification question.",
  },
] satisfies FlowPlatformProfile<VetFlowVoiceIntent, VetFlowVoiceEntity, VetFlowActionIntent, VetFlowLeadIntent, VetFlowLeadEntity>["conversation"]["voice"]["intentDefinitions"];

const leadIntentDefinitions = [
  {
    intent: "new_pet" as const,
    label: "New pet enquiry",
    keywords: ["new pet", "register", "join", "first appointment", "first visit"],
    followUpQuestion: "Could I have your name, mobile number, email if you'd like to share it, and the reason for getting in touch?",
    priority: 2,
    summaryHint: "Capture owner details and preferred appointment window.",
  },
  {
    intent: "emergency" as const,
    label: "Emergency",
    keywords: ["emergency", "urgent", "collapsed", "not breathing", "bleeding", "poison", "seizure"],
    followUpQuestion: "I'm sorry you're dealing with that. Is your pet breathing normally, and are they conscious right now?",
    priority: 5,
    summaryHint: "Escalate for urgent triage and immediate review.",
    escalate: true,
  },
  {
    intent: "vaccination" as const,
    label: "Vaccination",
    keywords: ["vaccination", "vaccines", "booster", "jabs"],
    followUpQuestion: "Certainly. Could I have your pet's name and the best number for a callback?",
    priority: 2,
    summaryHint: "Offer vaccination availability and keep the follow-up warm.",
  },
  {
    intent: "prescription_request" as const,
    label: "Prescription request",
    keywords: ["prescription", "repeat prescription", "medication"],
    followUpQuestion: "Could I have your name, your pet's name, and the medication you need help with?",
    priority: 3,
    summaryHint: "Capture the repeat prescription details.",
  },
  {
    intent: "surgery_consult" as const,
    label: "Surgery consultation",
    keywords: ["surgery", "neuter", "spay", "procedure", "operation"],
    followUpQuestion: "Of course. Could I have your pet's name, age, and the best time to call you back?",
    priority: 4,
    summaryHint: "Capture the procedure details and timing.",
  },
  {
    intent: "pricing_enquiry" as const,
    label: "Pricing enquiry",
    keywords: ["price", "pricing", "cost", "fee", "how much", "charge"],
    followUpQuestion: "Prices can vary depending on the assessment, so please share your contact details and the team can help properly.",
    priority: 2,
    summaryHint: "Avoid quoting exact prices unless clinic knowledge confirms them.",
  },
  {
    intent: "general_admin" as const,
    label: "General administration",
    keywords: ["admin", "question", "message", "callback"],
    followUpQuestion: "Of course. Could you tell me a little more so I can route this properly?",
    priority: 1,
    summaryHint: "Route to the team with a calm callback.",
  },
] satisfies FlowPlatformProfile<VetFlowVoiceIntent, VetFlowVoiceEntity, VetFlowActionIntent, VetFlowLeadIntent, VetFlowLeadEntity>["conversation"]["leads"]["intentDefinitions"];

const voiceEntityDefinitions = [
  ...createStandardContactVoiceEntities(),
  {
    entity: "petName" as const,
    label: "Pet name",
    patterns: [/(?:my pet|our pet|dog|cat|rabbit|animal)\s+(?:is called|name is|is)\s+([a-z]+(?:\s+[a-z]+){0,2})/i],
  },
  {
    entity: "petType" as const,
    label: "Pet type",
    patterns: [/(dog|cat|rabbit|kitten|puppy|bird|ferret|guinea pig|hamster)/i],
  },
  {
    entity: "breed" as const,
    label: "Breed",
    patterns: [/(breed|labrador|spaniel|bulldog|poodle|terrier|staffie|crossbreed|mixed breed)\s+(.+)/i],
  },
  {
    entity: "symptoms" as const,
    label: "Symptoms",
    patterns: [/(?:symptoms|problem|issue|concern|reason)\s+(.+)/i],
  },
  {
    entity: "age" as const,
    label: "Age",
    patterns: [/(?:aged|age is|is)\s+(\d{1,2})(?:\s*(?:years?|yrs?))?/i],
  },
  {
    entity: "medication" as const,
    label: "Medication",
    patterns: [/(?:medication|medicine|prescription|tablet|tablets)\s+(.+)/i],
  },
  {
    entity: "preferredVisitTime" as const,
    label: "Preferred visit time",
    patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i],
  },
] satisfies FlowPlatformProfile<VetFlowVoiceIntent, VetFlowVoiceEntity, VetFlowActionIntent, VetFlowLeadIntent, VetFlowLeadEntity>["conversation"]["voice"]["entityDefinitions"];

const leadEntityDefinitions = [
  ...createStandardContactLeadEntities(),
  {
    entity: "petName" as const,
    label: "Pet name",
    patterns: [/(?:pet's name|dog's name|cat's name|animal's name)\s+(.+)/i],
  },
  {
    entity: "petType" as const,
    label: "Pet type",
    patterns: [/(dog|cat|rabbit|kitten|puppy|bird|ferret|guinea pig|hamster)/i],
  },
  {
    entity: "breed" as const,
    label: "Breed",
    patterns: [/(breed|labrador|spaniel|bulldog|poodle|terrier|staffie|crossbreed|mixed breed)\s+(.+)/i],
  },
  {
    entity: "symptoms" as const,
    label: "Symptoms",
    patterns: [/(?:symptoms|problem|issue|concern|reason)\s+(.+)/i],
  },
  {
    entity: "age" as const,
    label: "Age",
    patterns: [/(?:aged|age is|is)\s+(\d{1,2})(?:\s*(?:years?|yrs?))?/i],
  },
  {
    entity: "medication" as const,
    label: "Medication",
    patterns: [/(?:medication|medicine|prescription|tablet|tablets)\s+(.+)/i],
  },
  {
    entity: "appointmentPreference" as const,
    label: "Appointment preference",
    patterns: [/(today|tomorrow|morning|afternoon|evening|this week|next week|weekday|weekend)/i],
  },
] satisfies FlowPlatformProfile<VetFlowVoiceIntent, VetFlowVoiceEntity, VetFlowActionIntent, VetFlowLeadIntent, VetFlowLeadEntity>["conversation"]["leads"]["entityDefinitions"];

const actionDefinitions = [
  { intent: "emergency" as const, label: "Emergency", keywords: ["emergency", "urgent", "collapsed", "not breathing", "bleeding"], followUpQuestion: "Is your pet breathing normally, and are they conscious right now?", priority: 5, summaryHint: "Treat as urgent and keep the callback immediate.", escalate: true },
  { intent: "appointment" as const, label: "Appointment", keywords: ["appointment", "visit", "booking"], followUpQuestion: "Could I have your pet's name and the best time for the team to call you back?", priority: 3, summaryHint: "Capture the appointment need and callback window." },
  { intent: "vaccination" as const, label: "Vaccination", keywords: ["vaccination", "booster", "jabs"], followUpQuestion: "Could I have your pet's name and the best day or time for a callback?", priority: 2, summaryHint: "Offer vaccination availability and capture the callback window." },
  { intent: "neutering" as const, label: "Neutering", keywords: ["neuter", "spay", "surgery"], followUpQuestion: "Could I have your pet's name, age, and a good time for the team to contact you?", priority: 4, summaryHint: "Capture the procedure details and timing." },
  { intent: "prescription" as const, label: "Prescription", keywords: ["prescription", "medication", "repeat prescription"], followUpQuestion: "Could I have your name, your pet's name, and the medication you need help with?", priority: 3, summaryHint: "Capture the repeat prescription details and any urgency." },
  { intent: "pricing" as const, label: "Pricing enquiry", keywords: ["price", "pricing", "cost", "how much"], followUpQuestion: "Prices can vary depending on the assessment, so please share your contact details and the team can help properly.", priority: 2, summaryHint: "Avoid quoting exact prices unless clinic knowledge confirms them." },
  { intent: "complaint" as const, label: "Complaint", keywords: ["complaint", "angry", "upset"], followUpQuestion: "I'm sorry that's been frustrating. Could I have your name, number, and a brief note about what happened?", priority: 5, summaryHint: "Escalate politely and capture the issue clearly.", escalate: true },
  { intent: "message" as const, label: "Message for reception", keywords: ["message", "reception", "pass on"], followUpQuestion: "Could I have your name, number, and the message you'd like passed on to reception?", priority: 1, summaryHint: "Take the message and hand it to reception." },
  { intent: "other" as const, label: "Other", keywords: ["other", "general", "question"], followUpQuestion: "Could you tell me a little more so I can help properly?", priority: 1, summaryHint: "Ask for one simple clarification." },
] satisfies FlowPlatformProfile<VetFlowVoiceIntent, VetFlowVoiceEntity, VetFlowActionIntent, VetFlowLeadIntent, VetFlowLeadEntity>["conversation"]["voice"]["actionDefinitions"];

export const vetFlowPlatformProfile = createFlowPlatformProfile({
  clinic: {
    appointmentRules: [
      "Offer the earliest available veterinary appointment and confirm the pet details.",
      "Check symptoms, pet type, age, and urgency before promising a slot.",
      "Use safety-first language for poisoning, collapse, breathing difficulty, and severe bleeding.",
    ],
    businessHours: "Monday to Saturday, 8:30am to 6:00pm",
    locale: "en-GB",
    name: "VetFlow Veterinary",
    region: "United Kingdom",
    branding: {
      accent: "green",
      background: "#eef8f3",
      icon: "paw-print",
      logoText: "VF",
      primary: "#10302a",
      secondary: "#2fa37b",
      surface: "#ffffff",
      text: "#182a24",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["emergency", "surgery_consult"],
      escalationRules: [
        "Emergency symptoms should escalate immediately.",
        "Avoid diagnosis and do not promise clinical outcomes.",
        "Always let a human vet receptionist step in when the caller asks.",
      ],
      fallbackIntent: "general_admin",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      intentDefinitions: leadIntentDefinitions,
      recoveryRules: [
        "Use the approved missed-call recovery SMS when consent exists.",
        "If the caller opts out, stop recovery messaging and record the decision.",
        "Keep after-hours recovery concise and reassuring.",
      ],
      summaryTemplates,
      templates: {
        email: {
          body: "Thanks for contacting VetFlow Veterinary. The team will review your request and follow up shortly.",
          subject: "VetFlow Veterinary follow-up",
        },
        sms: {
          help: "Thanks for getting in touch. We'll have the team review this and reply shortly.",
          missedCallRecovery: summaryTemplates.sms,
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      businessHoursPrompt: "Please route only urgent veterinary issues outside business hours.",
      conversationTone: "warm, calm, professional, British, reassuring",
      language: "en-GB",
      urgencyRules: [
        "Breathing difficulty, collapse, poisoning, or severe bleeding are the highest emergency priority.",
        "Urgent pain or trauma should be treated as high priority.",
        "Routine vaccinations and repeat prescriptions are lower urgency unless mixed with emergency symptoms.",
      ],
    },
    voice: {
      actionDefinitions,
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, reassuring, and never overly cheerful.",
      emergencyPrompt: "If the pet is having difficulty breathing, has collapsed, may have been poisoned, or is bleeding heavily, advise urgent emergency veterinary care and connect them to a human straight away.",
      businessHoursPrompt: "Please route only urgent veterinary issues outside business hours.",
      entityDefinitions: voiceEntityDefinitions,
      escalationIntents: ["emergency_pet", "complaint"],
      escalationRules: [
        "Emergency pet symptoms should escalate immediately.",
        "Avoid diagnosis and do not promise clinical outcomes.",
        "Always offer a human receptionist transfer if requested.",
      ],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to VetFlow, and I can help with appointments, vaccinations, repeat prescriptions, urgent pet concerns, and messages for the team. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["pet", "appointment", "vaccination", "surgery", "reception", "callback", "veterinary"],
      language: "en-GB",
      pronunciations: [
        { sayAs: "VetFlow", term: "VetFlow" },
        { sayAs: "vaccination", term: "vaccination" },
      ],
      recoveryRules: [
        "Keep callback offers warm and concise.",
        "Use voicemail for callers who cannot stay on the line.",
        "If the caller goes silent, transfer to the human fallback without delay.",
      ],
      speechRate: "95%",
      ssmlBreakMs: 220,
      ssmlEnabled: true,
      summaryTemplates: {
        ...summaryTemplates,
      },
      urgencyRules: [
        "Breathing difficulty, collapse, or poisoning are the highest emergency priority.",
        "Urgent pain or trauma should score highest after emergency red flags.",
        "Vaccinations and repeat prescriptions are lower priority unless the caller mentions an emergency symptom.",
      ],
      templates: {
        email: {
          body: "Thanks. We've made a note and the team will follow up shortly.",
          subject: "VetFlow Veterinary call follow-up",
        },
        sms: {
          help: "Thanks. I've made a note and a member of the team will review it shortly.",
          missedCallRecovery: "Hi, thanks for calling VetFlow. Sorry we missed you. Reply YES and we'll call you back.",
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      treatmentDefinitions: actionDefinitions,
      conversationTone: "warm, professional, confident, calm, friendly, British, reassuring",
      voice: "Polly.Amy-Neural",
    },
  },
  dashboard: {
    colors: {
      background: "#eef8f3",
      primary: "#10302a",
      secondary: "#2fa37b",
      surface: "#ffffff",
      text: "#182a24",
    },
    icons: ["paw-print", "calendar-check", "message-square", "shield-alert", "stethoscope"],
    labels: {
      activeCalls: "Active calls",
      followUp: "Follow-up queue",
      missedCalls: "Missed calls",
      recovery: "Recovery",
      revenueRecovered: "Recovered revenue",
      responseRate: "Response rate",
    },
  },
  id: "vetflow",
  industry: {
    description: "Veterinary reception, triage, and recovery workflow configuration.",
    key: "veterinary",
    name: "Veterinary",
    terminology: ["pet", "vaccination", "surgery", "vet", "appointment", "callback"],
  },
  knowledgeBase: createStandardKnowledgeBase({
    businessRules: [
      "Never diagnose or prescribe over the phone.",
      "Breathing difficulty, collapse, poisoning, or severe bleeding require immediate escalation.",
      "Avoid exact pricing promises unless the clinic knowledge base confirms them.",
      "Always ask for pet type, symptoms, age, and contact details for visit planning.",
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
        prompt: "Summarise the call clearly for the veterinary team with urgency, symptoms, and contact details.",
      },
    ],
    safeResponses: [
      "I can certainly help with that.",
      "I'm sorry your pet is unwell.",
      "Let's get the right vet lined up.",
      "Thank you. I've made a note.",
    ],
  }),
  notifications: [
    { channel: "dashboard", key: "call-summary-ready", template: "Show the summary on the live dashboard as soon as the call is captured.", trigger: "call.summary.created" },
    { channel: "sms", key: "missed-call-recovery", template: "Send the missed call recovery SMS from the active profile.", trigger: "call.missed" },
    { channel: "email", key: "urgent-escalation", template: "Email the team when an urgent veterinary issue is captured.", trigger: "lead.escalated" },
  ],
  workflows: createStandardWorkflowSet({
    answerDescription: "Answer the call with a warm veterinary receptionist greeting.",
    answerHandler: "handleVetFlowVoiceWebhook",
    profileId: "vetflow",
    persistDescription: "Create or update the lead record and recovery workflow.",
    persistHandler: "processVetFlowCallWebhook",
    profileName: "VetFlow Veterinary",
    recoveryHandler: "sendVetFlowRecoverySms",
    summaryDescription: "Generate the receptionist summary for the dashboard.",
    summaryHandler: "generateVetFlowCallSummary",
    speechDescription: "Collect speech input and continue the triage conversation.",
    speechHandler: "handleVetFlowVoiceSpeechWebhook",
  }),
});
