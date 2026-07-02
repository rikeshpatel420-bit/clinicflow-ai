import { strict as assert } from "node:assert";
import { clinicFlowPlatformProfile } from "../src/lib/flow-platform";

const voice = clinicFlowPlatformProfile.conversation.voice;

const bannedPhrases = [
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

console.log("ClinicFlow voice tone smoke check passed");
