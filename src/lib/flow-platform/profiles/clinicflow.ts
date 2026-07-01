import type { FlowPlatformProfile } from "../types";

export type ClinicFlowVoiceIntent =
  | "dental_emergency"
  | "new_patient_appointment"
  | "existing_patient_appointment"
  | "cancellation_reschedule"
  | "treatment_enquiry"
  | "pricing_enquiry"
  | "complaint"
  | "message_for_reception"
  | "other_unclear";

export type ClinicFlowTreatmentIntent =
  | "check_up"
  | "hygiene"
  | "whitening"
  | "invisalign_orthodontics"
  | "implant"
  | "extraction"
  | "wisdom_tooth"
  | "emergency"
  | "sedation"
  | "cosmetic_bonding"
  | "other";

export type ClinicFlowLeadIntent =
  | "new_patient"
  | "emergency"
  | "implant_consult"
  | "hygiene_recall"
  | "price_question"
  | "reschedule"
  | "general_admin";

type ClinicFlowVoiceEntity = "email" | "fullName" | "mobileNumber" | "preferredAppointmentTime";
type ClinicFlowLeadEntity =
  | "address"
  | "asset"
  | "customerType"
  | "email"
  | "equipment"
  | "phone"
  | "appointmentPreference"
  | "problem"
  | "property"
  | "treatment"
  | "urgency"
  | "vehicle";

const summaryTemplates = {
  appointmentRecommendation: "Offer the earliest suitable appointment and confirm the preferred callback window.",
  clinicalSummary: "No urgent clinical keywords detected. Continue standard reception triage.",
  followUpRecommendation: "Send staff-approved follow-up and monitor for reply.",
  patientSummary: "Patient summary pending.",
  receptionNotes: "Reception notes pending.",
  sms: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
  email: "Thanks for contacting ClinicFlow Dental. The team will review your request and follow up shortly.",
};

const sharedLeadIntentDefinitions = [
  {
    intent: "new_patient" as const,
    label: "New patient enquiry",
    keywords: ["new patient", "register", "join", "sign up", "first appointment", "first visit", "become a patient"],
    followUpQuestion: "Could I have your name, mobile number, and the reason for getting in touch?",
    priority: 2,
    summaryHint: "Capture contact details and preferred appointment window.",
  },
  {
    intent: "emergency" as const,
    label: "Emergency",
    keywords: ["pain", "swelling", "emergency", "urgent", "toothache", "broken", "abscess", "infection"],
    followUpQuestion: "I'm sorry you're dealing with that. Are you in severe pain or noticing any swelling?",
    priority: 5,
    summaryHint: "Escalate for urgent triage and same-day review.",
    escalate: true,
  },
  {
    intent: "implant_consult" as const,
    label: "Implant consultation",
    keywords: ["implant", "implant consultation", "implant enquiry", "implant options"],
    followUpQuestion: "Certainly. Could I have your name and the best number for the team to call you back?",
    priority: 4,
    summaryHint: "Offer a consultation slot and capture preferred timing.",
  },
  {
    intent: "hygiene_recall" as const,
    label: "Hygiene recall",
    keywords: ["hygiene", "clean", "cleaning", "scale and polish", "recall"],
    followUpQuestion: "Of course. Could I have your name and the best number for a callback?",
    priority: 3,
    summaryHint: "Offer hygiene availability and keep the follow-up warm.",
  },
  {
    intent: "price_question" as const,
    label: "Pricing enquiry",
    keywords: ["price", "pricing", "cost", "quote", "fee", "fees", "how much", "charge"],
    followUpQuestion: "Absolutely. Could I have your contact details and preferred time for the team to reach you?",
    priority: 2,
    summaryHint: "Avoid quoting exact prices unless clinic-approved knowledge confirms them.",
  },
  {
    intent: "reschedule" as const,
    label: "Reschedule request",
    keywords: ["move", "reschedule", "cancel", "rebook", "change my appointment"],
    followUpQuestion: "No problem. Could I have your name, the appointment date and time if you know it, and the replacement time you'd prefer?",
    priority: 1,
    summaryHint: "Capture the change request and confirm a replacement slot.",
  },
  {
    intent: "general_admin" as const,
    label: "General administration",
    keywords: ["general", "admin", "question", "query", "message", "callback"],
    followUpQuestion: "Of course. Could you tell me a little more so I can route this properly?",
    priority: 1,
    summaryHint: "Route to reception with a calm callback.",
  },
] satisfies FlowPlatformProfile<ClinicFlowVoiceIntent, ClinicFlowVoiceEntity, ClinicFlowTreatmentIntent, ClinicFlowLeadIntent, ClinicFlowLeadEntity>["conversation"]["leads"]["intentDefinitions"];

const leadEntityDefinitions = [
  {
    entity: "problem" as const,
    label: "Problem",
    patterns: [/(?:problem|issue|request|need)\s+(?:is|with|about)?\s+(.+)/i],
  },
  {
    entity: "urgency" as const,
    label: "Urgency",
    patterns: [/(urgent|asap|immediately|today|emergency|routine|non-urgent)/i],
  },
  {
    entity: "address" as const,
    label: "Address",
    patterns: [/(?:address is|at)\s+(.+)/i],
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
    entity: "customerType" as const,
    label: "Customer type",
    patterns: [/(new|existing|returning|repeat|commercial|residential|private|nhs)/i],
  },
  {
    entity: "appointmentPreference" as const,
    label: "Appointment preference",
    patterns: [/(today|tomorrow|morning|afternoon|evening|this week|next week|weekday|weekend)/i],
  },
  {
    entity: "asset" as const,
    label: "Asset",
    patterns: [/(?:asset|item|system|equipment|boiler|unit|door|roof|pipe)\s+(.+)/i],
  },
  {
    entity: "equipment" as const,
    label: "Equipment",
    patterns: [/(?:equipment|device|machine)\s+(.+)/i],
  },
  {
    entity: "treatment" as const,
    label: "Treatment",
    patterns: [/(implant|hygiene|whitening|invisalign|orthodontic|extraction|wisdom tooth|sedation|bonding|check-up|check up)/i],
  },
  {
    entity: "property" as const,
    label: "Property",
    patterns: [/(?:property|home|house|office|clinic)\s+(.+)/i],
  },
  {
    entity: "vehicle" as const,
    label: "Vehicle",
    patterns: [/(?:vehicle|car|van|fleet|truck)\s+(.+)/i],
  },
] satisfies FlowPlatformProfile<ClinicFlowVoiceIntent, ClinicFlowVoiceEntity, ClinicFlowTreatmentIntent, ClinicFlowLeadIntent, ClinicFlowLeadEntity>["conversation"]["leads"]["entityDefinitions"];

const voiceIntentDefinitions = [
  {
    intent: "dental_emergency" as const,
    label: "Dental emergency",
    keywords: ["emergency", "urgent", "pain", "toothache", "swelling", "bleeding", "trauma", "broken", "abscess", "infection"],
    followUpQuestion: "I'm sorry to hear that. Are you in severe pain, or have you noticed any swelling, bleeding, trauma, or trouble breathing or swallowing?",
    priority: 5,
    summaryHint: "Treat as urgent and keep the callback immediate.",
    escalate: true,
  },
  {
    intent: "new_patient_appointment" as const,
    label: "New patient appointment",
    keywords: ["new patient", "register", "join", "sign up", "first appointment", "first visit", "become a patient"],
    followUpQuestion: "Of course. Let's get your details. What's your full name, mobile number, email if you'd like to share it, the reason for your visit, and a preferred day or time?",
    priority: 4,
    summaryHint: "Capture contact details and the preferred appointment window.",
  },
  {
    intent: "existing_patient_appointment" as const,
    label: "Existing patient appointment",
    keywords: ["existing patient", "already a patient", "follow-up", "follow up", "review", "check my appointment", "my appointment"],
    followUpQuestion: "Of course. Could I have your full name, date of birth if you're comfortable sharing it, mobile number, reason for calling, and preferred day or time?",
    priority: 4,
    summaryHint: "Confirm the patient identity and next booking step.",
  },
  {
    intent: "cancellation_reschedule" as const,
    label: "Cancellation or reschedule",
    keywords: ["cancel", "cancellation", "reschedule", "move", "change my appointment", "rebook", "re-schedule"],
    followUpQuestion: "No problem. Could I have your name, the appointment date and time if you know it, the reason, and your preferred replacement time?",
    priority: 3,
    summaryHint: "Capture the cancellation or replacement time.",
  },
  {
    intent: "treatment_enquiry" as const,
    label: "Treatment enquiry",
    keywords: ["treatment", "implant", "invisalign", "orthodontic", "whitening", "extraction", "wisdom tooth", "sedation", "bonding", "hygiene"],
    followUpQuestion: "Absolutely. Which treatment are you asking about, and what are the best contact details and time for the team to reach you?",
    priority: 3,
    summaryHint: "Identify the treatment and capture the best callback window.",
  },
  {
    intent: "pricing_enquiry" as const,
    label: "Pricing enquiry",
    keywords: ["price", "pricing", "cost", "quote", "fee", "fees", "how much", "charge"],
    followUpQuestion: "Absolutely. Prices can vary depending on the assessment, so please share your contact details and preferred time and the team can help properly.",
    priority: 2,
    summaryHint: "Avoid quoting exact prices unless clinic-approved knowledge confirms them.",
  },
  {
    intent: "complaint" as const,
    label: "Complaint",
    keywords: ["complaint", "angry", "upset", "bad service", "not happy", "frustrated"],
    followUpQuestion: "I'm sorry that's been frustrating. Could I have your name, number, and what happened so we can look after it properly?",
    priority: 5,
    summaryHint: "Escalate politely and capture the issue clearly.",
    escalate: true,
  },
  {
    intent: "message_for_reception" as const,
    label: "Message for reception",
    keywords: ["message", "pass on", "ask reception", "reception", "note", "callback"],
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
] satisfies FlowPlatformProfile<ClinicFlowVoiceIntent, ClinicFlowVoiceEntity, ClinicFlowTreatmentIntent, ClinicFlowLeadIntent, ClinicFlowLeadEntity>["conversation"]["voice"]["intentDefinitions"];

const treatmentIntentDefinitions = [
  {
    intent: "check_up" as const,
    label: "Check-up",
    keywords: ["check-up", "check up", "routine", "exam", "examination"],
    followUpQuestion: "Of course. What day or time usually suits you best?",
    priority: 2,
    summaryHint: "Book a routine appointment.",
  },
  {
    intent: "hygiene" as const,
    label: "Hygiene",
    keywords: ["hygiene", "cleaning", "clean", "scale and polish"],
    followUpQuestion: "Certainly. What day or time would suit you best for a hygiene visit?",
    priority: 3,
    summaryHint: "Offer the next hygiene availability.",
  },
  {
    intent: "whitening" as const,
    label: "Whitening",
    keywords: ["whitening", "white teeth"],
    followUpQuestion: "Absolutely. What day or time would you prefer for a consultation?",
    priority: 2,
    summaryHint: "Offer a cosmetic consultation.",
  },
  {
    intent: "invisalign_orthodontics" as const,
    label: "Invisalign / orthodontics",
    keywords: ["invisalign", "brace", "orthodontic", "orthodontics"],
    followUpQuestion: "Of course. What is the best time for the team to call you back?",
    priority: 4,
    summaryHint: "Capture consultation availability.",
  },
  {
    intent: "implant" as const,
    label: "Implant",
    keywords: ["implant"],
    followUpQuestion: "Certainly. What time would suit you for a consultation?",
    priority: 5,
    summaryHint: "Offer implant consultation availability.",
  },
  {
    intent: "extraction" as const,
    label: "Extraction",
    keywords: ["extraction", "remove tooth", "take out tooth"],
    followUpQuestion: "I'm sorry you're dealing with that. What time would suit you for the team to call you back?",
    priority: 5,
    summaryHint: "Treat as clinically sensitive and triage carefully.",
  },
  {
    intent: "wisdom_tooth" as const,
    label: "Wisdom tooth",
    keywords: ["wisdom tooth", "wisdom teeth"],
    followUpQuestion: "Certainly. What time would suit you for a callback?",
    priority: 4,
    summaryHint: "Capture the treatment and route to the right clinician.",
  },
  {
    intent: "emergency" as const,
    label: "Emergency",
    keywords: ["emergency", "urgent", "pain", "toothache", "swelling", "bleeding", "trauma", "broken", "abscess", "infection"],
    followUpQuestion: "I'm sorry to hear that. Are you in severe pain or noticing any swelling?",
    priority: 5,
    summaryHint: "Escalate for urgent triage.",
    escalate: true,
  },
  {
    intent: "sedation" as const,
    label: "Sedation",
    keywords: ["sedation", "sedated"],
    followUpQuestion: "Of course. What is the best time for the team to call you back?",
    priority: 3,
    summaryHint: "Offer a consultation callback.",
  },
  {
    intent: "cosmetic_bonding" as const,
    label: "Cosmetic bonding",
    keywords: ["bonding", "cosmetic bonding"],
    followUpQuestion: "Absolutely. What time would suit you best for a consultation?",
    priority: 3,
    summaryHint: "Offer a cosmetic consultation.",
  },
  {
    intent: "other" as const,
    label: "Other",
    keywords: ["other", "general", "question"],
    followUpQuestion: "Of course. Could you tell me a little more so I can help properly?",
    priority: 1,
    summaryHint: "Ask for a little more context.",
  },
] satisfies FlowPlatformProfile<ClinicFlowVoiceIntent, ClinicFlowVoiceEntity, ClinicFlowTreatmentIntent, ClinicFlowLeadIntent, ClinicFlowLeadEntity>["conversation"]["voice"]["treatmentDefinitions"];

export const clinicFlowPlatformProfile = {
  clinic: {
    appointmentRules: [
      "Offer the earliest suitable appointment and confirm the preferred callback window.",
      "Avoid promising clinical outcomes before the clinician reviews the case.",
      "Use calm British phrasing with no Americanisms.",
    ],
    businessHours: "Monday to Friday, 8:00am to 6:00pm",
    locale: "en-GB",
    name: "ClinicFlow Dental",
    region: "United Kingdom",
    branding: {
      accent: "teal",
      background: "#eef4f2",
      icon: "phone-call",
      logoText: "CF",
      primary: "#10201d",
      secondary: "#087968",
      surface: "#ffffff",
      text: "#17211f",
    },
  },
  conversation: {
    leads: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      entityDefinitions: leadEntityDefinitions,
      escalationIntents: ["emergency", "implant_consult"],
      fallbackIntent: "general_admin",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      intentDefinitions: sharedLeadIntentDefinitions,
      summaryTemplates,
      templates: {
        email: {
          body: "Thanks for contacting ClinicFlow Dental. The team will review your request and follow up shortly.",
          subject: "ClinicFlow Dental follow-up",
        },
        sms: {
          help: "Thanks for getting in touch. We'll have the team review this and reply shortly.",
          missedCallRecovery: summaryTemplates.sms,
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      businessHoursPrompt: "Please route only urgent messages outside business hours.",
      conversationTone: "warm, calm, professional, British, premium private healthcare",
      language: "en-GB",
    },
    voice: {
      clarificationPrompt: "Could I have a little more detail so I can help properly?",
      closing: "Thanks. I've made a note and the team will take it from here.",
      empathy: "Warm, calm, British, reassuring, and never overly cheerful.",
      emergencyPrompt: "If someone has difficulty breathing or swallowing, advise urgent emergency care and connect them to a human straight away.",
      entityDefinitions: [
        { entity: "email", label: "Email", patterns: [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i], normalize: (value) => value.toLowerCase() },
        {
          entity: "fullName",
          label: "Full name",
          patterns: [/(?:my name is|i am|this is)\s+([a-z]+(?:\s+[a-z]+){0,3})/i, /name\s+(?:is|'s)?\s*([a-z]+(?:\s+[a-z]+){0,3})/i],
          normalize: (value) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        },
        { entity: "mobileNumber", label: "Mobile number", patterns: [/(?:\+44\s?7\d{3}[\s-]?\d{3}[\s-]?\d{3}|07\d{3}[\s-]?\d{3}[\s-]?\d{3})/i], normalize: (value) => value.replace(/\s+/g, " ").trim() },
        { entity: "preferredAppointmentTime", label: "Preferred appointment time", patterns: [/(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i, /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i] },
      ],
      escalationIntents: ["dental_emergency", "complaint"],
      fallbackIntent: "other_unclear",
      fallbackPrompt: "Could you tell me a little more so I can help properly?",
      greeting: "Hello, thanks for calling {{clinicName}}. You're through to ClinicFlow Dental, and I can help with appointments, emergencies, cancellations, treatment questions, or a message for the team. How can I help today?",
      intentDefinitions: voiceIntentDefinitions,
      industryTerminology: ["appointment", "emergency", "reception", "callback", "consultation", "hygiene", "implant", "Invisalign"],
      language: "en-GB",
      pronunciations: [
        { sayAs: "ClinicFlow", term: "ClinicFlow" },
        { sayAs: "Bupa", term: "Bupa" },
      ],
      speechRate: "94%",
      ssmlBreakMs: 220,
      ssmlEnabled: true,
      businessHoursPrompt: "Please route only urgent voice messages outside business hours.",
      summaryTemplates: {
        ...summaryTemplates,
        receptionNotes: "Reception notes pending.",
      },
      treatmentDefinitions: treatmentIntentDefinitions,
      templates: {
        email: {
          body: "Thanks. We've made a note and the team will follow up shortly.",
          subject: "ClinicFlow Dental call follow-up",
        },
        sms: {
          help: "Thanks. I've made a note and a member of the team will review it shortly.",
          missedCallRecovery: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
          optOut: "You've been opted out of SMS recovery messages. We won't send any more recovery texts.",
          replyYes: "Thanks. We'll call you back shortly.",
          resubscribe: "You're back on the SMS recovery list. We'll keep helping from here.",
        },
      },
      conversationTone: "warm, professional, confident, calm, friendly, British, polite, empathetic",
      voice: "Polly.Amy-Neural",
    },
  },
  dashboard: {
    colors: {
      background: "#eef4f2",
      primary: "#10201d",
      secondary: "#087968",
      surface: "#ffffff",
      text: "#17211f",
    },
    icons: ["phone-call", "sparkles", "calendar-check", "message-square", "shield-check"],
  },
  id: "clinicflow",
  industry: {
    description: "Private dental practice receptionist and recovery workflow configuration.",
    key: "dental",
    name: "Dental",
    terminology: ["patient", "appointment", "hygiene", "implant", "emergency", "callback"],
  },
  knowledgeBase: {
    businessRules: [
      "Never diagnose or prescribe.",
      "Escalate breathing or swallowing difficulty immediately.",
      "Avoid exact pricing promises unless the clinic knowledge base confirms them.",
      "Always allow transfer to a human receptionist.",
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
        prompt: "Ask one question at a time, capture the caller's need, and only escalate when safety requires it.",
      },
      {
        key: "summary",
        title: "Summary",
        prompt: "Summarise the call clearly for the reception team with urgency, next action, and contact details.",
      },
    ],
    safeResponses: [
      "I can certainly help with that.",
      "I'm sorry you're in pain.",
      "Let's get you to the right clinician.",
      "Thank you. I've made a note.",
    ],
  },
  notifications: [
    { channel: "dashboard", key: "call-summary-ready", template: "Show the summary on the live dashboard as soon as the call is captured.", trigger: "call.summary.created" },
    { channel: "sms", key: "missed-call-recovery", template: "Send the missed call recovery SMS from the active clinic profile.", trigger: "call.missed" },
    { channel: "email", key: "lead-escalation", template: "Email the team when an urgent lead or complaint is captured.", trigger: "lead.escalated" },
  ],
  workflows: [
    { channel: "voice", description: "Answer the call with a warm receptionist greeting.", handler: "handleTwilioVoiceWebhook", key: "answer-inbound-call", label: "Answer inbound call", trigger: "twilio.voice.received" },
    { channel: "workflow", description: "Collect speech input and continue the triage conversation.", handler: "handleTwilioVoiceSpeechWebhook", key: "continue-voice-conversation", label: "Continue conversation", trigger: "twilio.voice.speech" },
    { channel: "sms", description: "Send a missed-call recovery SMS and keep the recovery workflow moving.", handler: "sendRecoverySms", key: "send-missed-call-recovery", label: "Send recovery SMS", trigger: "call.missed" },
    { channel: "workflow", description: "Create or update the lead record and recovery workflow.", handler: "processTwilioCallWebhook", key: "persist-call", label: "Persist call", trigger: "twilio.call.received" },
    { channel: "workflow", description: "Generate the receptionist summary for the dashboard.", handler: "generateCallReceptionSummary", key: "generate-call-summary", label: "Generate summary", trigger: "call.summary.requested" },
  ],
} satisfies FlowPlatformProfile<ClinicFlowVoiceIntent, ClinicFlowVoiceEntity, ClinicFlowTreatmentIntent, ClinicFlowLeadIntent, ClinicFlowLeadEntity>;
