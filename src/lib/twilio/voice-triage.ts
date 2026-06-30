export type VoiceIntent =
  | "dental_emergency"
  | "new_patient_appointment"
  | "existing_patient_appointment"
  | "cancellation_reschedule"
  | "treatment_enquiry"
  | "pricing_enquiry"
  | "complaint"
  | "message_for_reception"
  | "other_unclear";

export type TreatmentType =
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

export type VoiceCaptureDetails = {
  breathingOrSwallowingIssue: boolean;
  email: string | null;
  fullName: string | null;
  hasBleeding: boolean;
  hasPain: boolean;
  hasSwelling: boolean;
  hasTrauma: boolean;
  mobileNumber: string | null;
  nhsPrivatePreference: "nhs" | "private" | null;
  preferredAppointmentTime: string | null;
  reason: string;
  requestedDateTime: string | null;
  wantsHuman: boolean;
};

const emergencyKeywords = ["emergency", "urgent", "pain", "toothache", "swelling", "bleeding", "trauma", "broken", "abscess", "infection"];
const complaintKeywords = ["complaint", "angry", "upset", "bad service", "not happy", "frustrated"];
const humanKeywords = ["human", "receptionist", "person", "staff", "someone", "agent", "speak to", "call me back", "talk to"];
const pricingKeywords = ["price", "pricing", "cost", "quote", "fee", "fees", "how much", "charge"];
const newPatientKeywords = ["new patient", "register", "join", "sign up", "first appointment", "first visit", "become a patient"];
const existingPatientKeywords = ["existing patient", "already a patient", "follow-up", "follow up", "review", "check my appointment", "my appointment"];
const cancellationKeywords = ["cancel", "cancellation", "reschedule", "move", "change my appointment", "rebook", "re-schedule"];
const receptionKeywords = ["message", "pass on", "ask reception", "reception", "note", "callback"];
const treatmentKeywords: Array<{ intent: TreatmentType; keywords: string[] }> = [
  { intent: "implant", keywords: ["implant"] },
  { intent: "invisalign_orthodontics", keywords: ["invisalign", "brace", "orthodontic", "orthodontics"] },
  { intent: "hygiene", keywords: ["hygiene", "cleaning", "clean", "scale and polish"] },
  { intent: "whitening", keywords: ["whitening", "white teeth"] },
  { intent: "extraction", keywords: ["extraction", "remove tooth", "take out tooth"] },
  { intent: "wisdom_tooth", keywords: ["wisdom tooth", "wisdom teeth"] },
  { intent: "sedation", keywords: ["sedation", "sedated"] },
  { intent: "cosmetic_bonding", keywords: ["bonding", "cosmetic bonding"] },
  { intent: "check_up", keywords: ["check-up", "check up", "routine", "exam", "examination"] },
  { intent: "emergency", keywords: emergencyKeywords },
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function lower(text: string) {
  return normalizeText(text).toLowerCase();
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

function extractMobileNumber(text: string) {
  const match = text.match(/(?:\+44\s?7\d{3}[\s-]?\d{3}[\s-]?\d{3}|07\d{3}[\s-]?\d{3}[\s-]?\d{3})/);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function extractName(text: string) {
  const patterns = [
    /(?:my name is|i am|this is)\s+([a-z]+(?:\s+[a-z]+){0,3})/i,
    /name\s+(?:is|'s)?\s*([a-z]+(?:\s+[a-z]+){0,3})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\b\w/g, (value) => value.toUpperCase()).trim();
    }
  }

  return null;
}

function extractPreferredTime(text: string) {
  const patterns = [
    /(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening))?(?:\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?/i,
    /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return normalizeText(match[0]);
    }
  }

  return null;
}

function detectEmergencyFlags(text: string) {
  const flags = [
    { flag: "pain", hit: /pain|toothache|ache|sore/i.test(text) },
    { flag: "swelling", hit: /swelling|swollen|face is swollen/i.test(text) },
    { flag: "bleeding", hit: /bleeding|bleed/i.test(text) },
    { flag: "trauma", hit: /trauma|knocked out|broke|broken tooth|accident/i.test(text) },
    { flag: "breathing_or_swallowing", hit: /breathing|swallowing|cannot swallow|trouble breathing|difficulty breathing/i.test(text) },
  ];

  return flags.filter((item) => item.hit).map((item) => item.flag);
}

export function classifyVoiceIntent(text: string): VoiceIntent {
  const value = lower(text);

  if (containsAny(value, complaintKeywords)) return "complaint";
  if (containsAny(value, emergencyKeywords)) return "dental_emergency";
  if (containsAny(value, pricingKeywords)) return "pricing_enquiry";
  if (containsAny(value, newPatientKeywords)) return "new_patient_appointment";
  if (containsAny(value, existingPatientKeywords)) return "existing_patient_appointment";
  if (containsAny(value, cancellationKeywords)) return "cancellation_reschedule";
  if (containsAny(value, receptionKeywords)) return "message_for_reception";
  if (containsAny(value, treatmentKeywords.flatMap((item) => item.keywords))) return "treatment_enquiry";

  return "other_unclear";
}

export function classifyTreatmentType(text: string): TreatmentType {
  const value = lower(text);
  for (const item of treatmentKeywords) {
    if (containsAny(value, item.keywords)) {
      return item.intent;
    }
  }

  return "other";
}

export function estimateVoiceUrgency(intent: VoiceIntent, details: VoiceCaptureDetails) {
  if (details.breathingOrSwallowingIssue) return 100;
  if (intent === "dental_emergency") return 95;
  if (details.hasSwelling || details.hasBleeding || details.hasTrauma) return 92;
  if (intent === "complaint") return 78;
  if (intent === "cancellation_reschedule") return 56;
  if (intent === "pricing_enquiry") return 48;
  if (intent === "message_for_reception") return 42;
  if (intent === "treatment_enquiry") return 74;
  if (intent === "new_patient_appointment" || intent === "existing_patient_appointment") return 68;
  return 50;
}

export function extractVoiceCaptureDetails(text: string): VoiceCaptureDetails {
  const normalized = normalizeText(text);
  const value = lower(text);
  const emergencyFlags = detectEmergencyFlags(text);

  return {
    breathingOrSwallowingIssue: emergencyFlags.includes("breathing_or_swallowing"),
    email: extractEmail(text),
    fullName: extractName(text),
    hasBleeding: emergencyFlags.includes("bleeding"),
    hasPain: emergencyFlags.includes("pain"),
    hasSwelling: emergencyFlags.includes("swelling"),
    hasTrauma: emergencyFlags.includes("trauma"),
    mobileNumber: extractMobileNumber(text),
    nhsPrivatePreference: value.includes("nhs") ? "nhs" : value.includes("private") ? "private" : null,
    preferredAppointmentTime: extractPreferredTime(text),
    reason: normalized,
    requestedDateTime: extractPreferredTime(text),
    wantsHuman: containsAny(value, humanKeywords),
  };
}

export function voiceIntentLabel(intent: VoiceIntent) {
  switch (intent) {
    case "dental_emergency":
      return "Dental emergency";
    case "new_patient_appointment":
      return "New patient appointment";
    case "existing_patient_appointment":
      return "Existing patient appointment";
    case "cancellation_reschedule":
      return "Cancellation or reschedule";
    case "treatment_enquiry":
      return "Treatment enquiry";
    case "pricing_enquiry":
      return "Pricing enquiry";
    case "complaint":
      return "Complaint";
    case "message_for_reception":
      return "Message for reception";
    default:
      return "Other or unclear";
  }
}

export function treatmentLabel(treatment: TreatmentType) {
  switch (treatment) {
    case "check_up":
      return "Check-up";
    case "hygiene":
      return "Hygiene";
    case "whitening":
      return "Whitening";
    case "invisalign_orthodontics":
      return "Invisalign / orthodontics";
    case "implant":
      return "Implant";
    case "extraction":
      return "Extraction";
    case "wisdom_tooth":
      return "Wisdom tooth";
    case "emergency":
      return "Emergency";
    case "sedation":
      return "Sedation";
    case "cosmetic_bonding":
      return "Cosmetic bonding";
    default:
      return "Other";
  }
}

export function buildVoiceLeadSummary(input: {
  details: VoiceCaptureDetails;
  intent: VoiceIntent;
  treatmentType: TreatmentType;
  callerNumber: string | null;
  callSid: string;
  clinicName: string;
}) {
  const contactParts = [
    input.details.fullName ? `Name: ${input.details.fullName}` : null,
    input.details.mobileNumber ? `Mobile: ${input.details.mobileNumber}` : input.callerNumber ? `Caller: ${input.callerNumber}` : null,
    input.details.email ? `Email: ${input.details.email}` : null,
    input.details.preferredAppointmentTime ? `Preferred time: ${input.details.preferredAppointmentTime}` : null,
    input.details.nhsPrivatePreference ? `${input.details.nhsPrivatePreference.toUpperCase()} preference` : null,
  ].filter(Boolean);

  const redFlag = input.details.breathingOrSwallowingIssue
    ? "Red flag: breathing or swallowing difficulty reported. Urgent emergency care advised."
    : null;

  const treatment = input.intent === "treatment_enquiry" ? `Treatment type: ${treatmentLabel(input.treatmentType)}.` : null;

  return [
    input.details.fullName ?? input.callerNumber ?? "Caller",
    `${voiceIntentLabel(input.intent)} for ${input.clinicName}.`,
    input.details.reason ? `Reason: ${input.details.reason}.` : null,
    treatment,
    redFlag,
    contactParts.length ? contactParts.join(". ") + "." : null,
    `Call SID: ${input.callSid}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildVoiceTranscriptSummary(input: {
  details: VoiceCaptureDetails;
  intent: VoiceIntent;
  urgency: number;
  treatmentType: TreatmentType;
}) {
  const redFlag = input.details.breathingOrSwallowingIssue ? "Urgent red flag noted." : null;

  return [
    `Intent: ${voiceIntentLabel(input.intent)}.`,
    `Urgency: ${input.urgency}/100.`,
    `Treatment: ${treatmentLabel(input.treatmentType)}.`,
    input.details.reason ? `Caller said: ${input.details.reason}.` : null,
    input.details.preferredAppointmentTime ? `Preferred time: ${input.details.preferredAppointmentTime}.` : null,
    input.details.fullName ? `Name captured: ${input.details.fullName}.` : null,
    input.details.mobileNumber ? `Mobile captured: ${input.details.mobileNumber}.` : null,
    input.details.email ? `Email captured: ${input.details.email}.` : null,
    input.details.nhsPrivatePreference ? `${input.details.nhsPrivatePreference.toUpperCase()} preference noted.` : null,
    redFlag,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildVoiceGreetingMessage(clinicName: string) {
  return `Hello, you've reached ${clinicName}. I can help with appointments, emergencies, cancellations, treatment enquiries and messages. How can I help today?`;
}

export function buildVoiceFollowUpPrompt(intent: VoiceIntent) {
  switch (intent) {
    case "dental_emergency":
      return "Are you in severe pain? Do you have swelling, bleeding, trauma, or any difficulty breathing or swallowing?";
    case "new_patient_appointment":
      return "Please tell me your full name, mobile number, email if possible, reason for visit, and your preferred day or time.";
    case "existing_patient_appointment":
      return "Please tell me your full name, date of birth if you are comfortable sharing it, mobile number, reason for calling, and preferred day or time.";
    case "cancellation_reschedule":
      return "Please tell me your full name, the appointment date and time if you know it, the reason, and your preferred replacement time.";
    case "treatment_enquiry":
      return "Please tell me which treatment you are asking about, your contact details, and your preferred consultation time.";
    case "pricing_enquiry":
      return "Prices vary depending on clinical assessment. Please tell me your contact details and preferred consultation time so the team can help.";
    case "complaint":
      return "I am sorry to hear that. Please tell me your name, contact number, and what happened so we can arrange the right follow-up.";
    case "message_for_reception":
      return "Please tell me your name, contact details, and the message you would like me to pass to reception.";
    default:
      return "Please tell me a little more so I can route this to the right member of the team.";
  }
}
