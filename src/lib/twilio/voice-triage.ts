import { createConversationEngine } from "@/lib/conversation/engine";
import { buildConversationEngineConfig, getActiveFlowPlatformProfile } from "@/lib/flow-platform";

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

const activeFlowPlatformProfile = getActiveFlowPlatformProfile();
const voiceConversationEngine = createConversationEngine<VoiceIntent, "email" | "fullName" | "mobileNumber" | "preferredAppointmentTime">(
  buildConversationEngineConfig(activeFlowPlatformProfile.conversation.voice),
);

const treatmentConversationEngine = createConversationEngine<TreatmentType>({
  fallbackIntent: "other",
  intentRules: activeFlowPlatformProfile.conversation.voice.treatmentDefinitions.map((definition) => ({
    intent: definition.intent,
    keywords: definition.keywords,
    priority: definition.priority,
  })),
});

const humanKeywords = ["human", "receptionist", "person", "staff", "someone", "agent", "speak to", "call me back", "talk to"];

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function lower(text: string) {
  return normalizeText(text).toLowerCase();
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
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
  return voiceConversationEngine.classifyIntent(text).intent;
}

export function classifyTreatmentType(text: string): TreatmentType {
  return treatmentConversationEngine.classifyIntent(text).intent;
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
  const extracted = voiceConversationEngine.extractEntities(text).entities;

  return {
    breathingOrSwallowingIssue: emergencyFlags.includes("breathing_or_swallowing"),
    email: extracted.email ?? null,
    fullName: extracted.fullName ?? null,
    hasBleeding: emergencyFlags.includes("bleeding"),
    hasPain: emergencyFlags.includes("pain"),
    hasSwelling: emergencyFlags.includes("swelling"),
    hasTrauma: emergencyFlags.includes("trauma"),
    mobileNumber: extracted.mobileNumber ?? null,
    nhsPrivatePreference: value.includes("nhs") ? "nhs" : value.includes("private") ? "private" : null,
    preferredAppointmentTime: extracted.preferredAppointmentTime ?? null,
    reason: normalized,
    requestedDateTime: extracted.preferredAppointmentTime ?? null,
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
  return activeFlowPlatformProfile.conversation.voice.greeting.replace("{{clinicName}}", clinicName);
}

export function buildVoiceFollowUpPrompt(intent: VoiceIntent) {
  return voiceConversationEngine.buildFollowUpPrompt(intent);
}
