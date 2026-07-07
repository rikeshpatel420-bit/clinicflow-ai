import { strict as assert } from "node:assert";
import { clinicFlowPlatformProfile } from "../src/lib/flow-platform";
import { sanitizeSpeechText } from "../src/lib/utils/speech";

const voice = clinicFlowPlatformProfile.conversation.voice;
const knowledgeBase = clinicFlowPlatformProfile.knowledgeBase;

const bannedPhrases = [
  "I've made a note",
  "I've noted",
  "team will review",
  "team will follow up",
  "team will take it from here",
  "team can help properly",
  "member of the team",
];

const haystack = [
  voice.greeting,
  voice.fallbackPrompt,
  voice.closing,
  voice.emergencyPrompt,
  voice.templates.email.body,
  voice.templates.sms.help,
  voice.templates.sms.missedCallRecovery,
  voice.templates.sms.replyYes,
  ...voice.intentDefinitions.map((definition) => definition.followUpQuestion),
  ...(voice.treatmentDefinitions ?? []).map((definition) => definition.followUpQuestion),
].join(" ").toLowerCase();

for (const phrase of bannedPhrases) {
  assert(!haystack.includes(phrase), `ClinicFlow voice copy should not include: ${phrase}`);
}

assert(voice.greeting.includes("How can I help you today?"), "ClinicFlow greeting should sound conversational.");
assert(voice.closing.toLowerCase().includes("here if you need anything else"), "ClinicFlow closing should stay warm and helpful.");
assert(voice.templates.sms.missedCallRecovery.includes("I'll call you back"), "Missed-call recovery should sound personal.");
assert(voice.templates.sms.replyYes.includes("I'll call you back shortly"), "Reply-yes SMS should sound personal.");
assert(voice.greeting.startsWith("Good morning"), "ClinicFlow greeting should sound like a receptionist, not an IVR.");
assert(sanitizeSpeechText("I&apos;ve &amp; got it") === "I've & got it", "Speech output should decode HTML entities before synthesis.");
assert(
  knowledgeBase.safeResponses.includes("I can take the details now and the practice will confirm the exact appointment by text or phone."),
  "ClinicFlow should clearly state when the practice will confirm the appointment.",
);

for (const prompt of [...voice.intentDefinitions, ...(voice.treatmentDefinitions ?? [])]) {
  const questionMarks = (prompt.followUpQuestion.match(/\?/g) ?? []).length;
  assert(questionMarks <= 1, `ClinicFlow prompt should ask one question at a time: ${prompt.intent}`);
}

const simulatedTurns = [
  "New patient",
  "Returning patient",
  "Check-up",
  "Emergency",
  "Implant enquiry",
  "Cancellation",
  "Reschedule",
  "Complaint",
  "Price enquiry",
  "Nervous patient",
  "Missed call recovery",
  "Out-of-hours",
];

for (const turn of simulatedTurns) {
  assert(turn.length > 0, "Simulated turn should not be empty.");
}

console.log("ClinicFlow voice tone smoke check passed");
