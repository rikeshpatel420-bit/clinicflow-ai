import { createConversationEngine } from "@/lib/conversation/engine";
import { buildConversationEngineConfig, getActiveFlowPlatformProfile } from "@/lib/flow-platform";

export type VoiceIntent = string;

export type TreatmentType = string;

export type VoiceEntity =
  string;

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
const voiceConversationEngine = createConversationEngine<VoiceIntent, VoiceEntity>(
  buildConversationEngineConfig(activeFlowPlatformProfile.conversation.voice),
);

const voiceActionDefinitions =
  activeFlowPlatformProfile.conversation.voice.actionDefinitions ??
  activeFlowPlatformProfile.conversation.voice.treatmentDefinitions ??
  [];

const voiceIntentLabels = new Map<string, string>(activeFlowPlatformProfile.conversation.voice.intentDefinitions.map((definition) => [definition.intent, definition.label]));
const voiceActionLabels = new Map<string, string>(voiceActionDefinitions.map((definition) => [definition.intent, definition.label]));

const treatmentConversationEngine = createConversationEngine<TreatmentType>({
  fallbackIntent: "other",
  intentRules: voiceActionDefinitions.map((definition) => ({
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

function extractPreferredAppointmentPhrase(text: string) {
  const normalized = normalizeText(text);
  const weekdayPattern = "\\b(?:next\\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b";
  const datePattern = "\\b\\d{1,2}(?:st|nd|rd|th)?(?:\\s+of)?\\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\\b";
  const timePattern = "\\b(?:morning|afternoon|evening|lunchtime|noon|after school|after lunch|around\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?|\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)|\\d{1,2}\\s*o'clock)\\b";
  const match = normalized.match(new RegExp(`(${weekdayPattern}|${datePattern})(?:[^.?!]{0,80}${timePattern})?`, "i"));

  if (match?.[0]) {
    return match[0].trim();
  }

  const timeOnly = normalized.match(new RegExp(timePattern, "i"));
  return timeOnly?.[0]?.trim() ?? null;
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  if (/\b(price|pricing|cost|quote|fee|fees|how much|charge)\b/i.test(text)) {
    return "pricing_enquiry";
  }

  if (/\b(cancel|cancellation)\b/i.test(text) && !/\b(reschedule|rebook|move|change)\b/i.test(text)) {
    return "cancellation_reschedule";
  }

  return voiceConversationEngine.classifyIntent(text).intent;
}

export function isVoiceBookingRequestText(text: string) {
  if (/\b(price|pricing|cost|quote|fee|fees|how much|charge)\b/i.test(text)) {
    return false;
  }

  if (/\b(cancel|cancellation)\b/i.test(text) && !/\b(reschedule|rebook|change my appointment|move my appointment|move it|change it)\b/i.test(text)) {
    return false;
  }

  return /\b(book|booking|booked|appointment|schedule|reserve|slot|available time|preferred day|preferred time|reschedule|rebook|change my appointment|move my appointment|move it|change it)\b/i.test(text);
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
  const preferredAppointmentTime = extracted.preferredAppointmentTime ?? extractPreferredAppointmentPhrase(text);

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
    preferredAppointmentTime,
    reason: normalized,
    requestedDateTime: preferredAppointmentTime,
    wantsHuman: containsAny(value, humanKeywords),
  };
}

export function voiceIntentLabel(intent: VoiceIntent) {
  return voiceIntentLabels.get(intent) ?? titleCase(intent);
}

export function treatmentLabel(treatment: TreatmentType) {
  return voiceActionLabels.get(treatment) ?? titleCase(treatment);
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

  const treatment = `Case type: ${treatmentLabel(input.treatmentType)}.`;

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
    `Case type: ${treatmentLabel(input.treatmentType)}.`,
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

export function resolveUkTimeGreeting(now = new Date()) {
  const hourPart = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/London",
    })
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;
  const londonHour = Number.parseInt(hourPart ?? "", 10) % 24;

  if (Number.isNaN(londonHour)) {
    return "Hello";
  }

  if (londonHour >= 5 && londonHour < 12) {
    return "Good morning";
  }

  if (londonHour >= 12 && londonHour < 18) {
    return "Good afternoon";
  }

  if (londonHour >= 18 && londonHour <= 22) {
    return "Good evening";
  }

  return "Hello";
}

export function buildVoiceGreetingMessage(clinicName: string, now = new Date()) {
  const timeGreeting = resolveUkTimeGreeting(now);

  return activeFlowPlatformProfile.conversation.voice.greeting
    .replace("Good morning", timeGreeting)
    .replace("{{timeGreeting}}", timeGreeting)
    .replace("{{clinicName}}", clinicName);
}

export function buildVoiceFollowUpPrompt(intent: VoiceIntent) {
  return voiceConversationEngine.buildFollowUpPrompt(intent);
}
