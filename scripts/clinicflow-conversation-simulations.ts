import { strict as assert } from "node:assert";
import {
  buildVoiceFollowUpPrompt,
  classifyTreatmentType,
  classifyVoiceIntent,
  extractVoiceCaptureDetails,
  isVoiceBookingRequestText,
} from "../src/lib/twilio/voice-triage";
import { resolvePreferredStart } from "../src/lib/integrations/calendar/shared";
import { sanitizeSpeechText } from "../src/lib/utils/speech";

type Simulation = {
  expectBooking?: boolean;
  expectEmergency?: boolean;
  expectHuman?: boolean;
  expectedIntent?: string;
  label: string;
  speech: string;
};

const bannedSpokenPhrases = [
  "i've made a note",
  "i've got your details",
  "i've got the details",
  "i'll make sure someone contacts you",
  "i've noted that",
  "team will review",
];

const simulations: Simulation[] = [
  { expectEmergency: true, expectedIntent: "dental_emergency", label: "emergency", speech: "I'm in severe tooth pain and my face is swollen" },
  { expectedIntent: "treatment_enquiry", label: "implant", speech: "I'd like to ask about an implant consultation" },
  { expectedIntent: "treatment_enquiry", label: "Invisalign", speech: "Can I ask about Invisalign please" },
  { expectBooking: true, label: "hygiene", speech: "I need a hygiene appointment" },
  { expectBooking: true, label: "child", speech: "Can I book an appointment for my child next week" },
  { expectHuman: false, expectedIntent: "complaint", label: "complaint", speech: "I'm not happy and want to make a complaint" },
  { expectedIntent: "cancellation_reschedule", label: "cancellation", speech: "I need to cancel my appointment" },
  { expectedIntent: "cancellation_reschedule", label: "reschedule", speech: "Can I reschedule my appointment to Friday" },
  { expectedIntent: "pricing_enquiry", label: "price enquiry", speech: "How much does whitening cost" },
  { expectBooking: true, label: "nervous patient", speech: "I'm nervous but I need to book a check up" },
  { label: "missed call", speech: "I missed a call from the practice and need to book" , expectBooking: true },
  { expectBooking: true, label: "booking", speech: "I'd like to book an appointment" },
  { expectedIntent: "existing_patient_appointment", label: "returning patient", speech: "I'm already a patient and need a review" },
  { expectedIntent: "other_unclear", label: "silence", speech: "" },
  { expectBooking: true, label: "interruption", speech: "Actually sorry can you book me in instead" },
  { expectBooking: true, label: "this number", speech: "Can you book me and use this number" },
  { expectBooking: true, label: "send me a text", speech: "Please book that and send me a text" },
  { expectEmergency: true, expectedIntent: "dental_emergency", label: "red flag", speech: "My mouth is swelling and I'm having trouble swallowing" },
  { expectedIntent: "treatment_enquiry", label: "whitening", speech: "I'd like whitening before a wedding" },
  { expectBooking: true, label: "check-up", speech: "Can I book a routine check up Tuesday morning" },
];

assert.equal(simulations.length, 20, "Voice sprint should run exactly 20 core conversation simulations.");

for (const simulation of simulations) {
  const intent = classifyVoiceIntent(simulation.speech);
  const treatment = classifyTreatmentType(simulation.speech);
  const details = extractVoiceCaptureDetails(simulation.speech);
  const prompt = buildVoiceFollowUpPrompt(intent);
  const spoken = sanitizeSpeechText(prompt).toLowerCase();
  const questionCount = (prompt.match(/\?/g) ?? []).length;

  for (const phrase of bannedSpokenPhrases) {
    assert(!spoken.includes(phrase), `${simulation.label} prompt includes banned wording: ${phrase}`);
  }

  assert(!prompt.includes("&apos;") && !prompt.includes("&amp;"), `${simulation.label} prompt should not contain escaped entities.`);
  assert(questionCount <= 1, `${simulation.label} prompt should ask one question at a time.`);
  assert(treatment.length > 0, `${simulation.label} should produce a treatment/action classification.`);

  if (simulation.expectedIntent) {
    assert.equal(intent, simulation.expectedIntent, `${simulation.label} intent mismatch.`);
  }

  if (simulation.expectBooking) {
    assert(isVoiceBookingRequestText(simulation.speech), `${simulation.label} should enter booking mode.`);
  }

  if (simulation.expectEmergency) {
    assert(details.hasPain || details.hasSwelling || details.hasBleeding || details.hasTrauma || details.breathingOrSwallowingIssue, `${simulation.label} should capture emergency flags.`);
  }

  if (simulation.expectHuman) {
    assert(details.wantsHuman, `${simulation.label} should capture human-transfer intent.`);
  }
}

assert.equal(classifyVoiceIntent("How much is a hygienist appointment?"), "pricing_enquiry", "Pricing questions with appointment wording should stay pricing.");
assert.equal(isVoiceBookingRequestText("How much is a hygienist appointment?"), false, "Pricing questions should not enter booking mode.");
assert.equal(isVoiceBookingRequestText("Could you send me a text confirmation?"), false, "SMS confirmation requests should not be treated as booking requests.");
assert.equal(isVoiceBookingRequestText("Can I reschedule my appointment to Tuesday?"), true, "Reschedule requests should remain bookable.");

const forensicBaseDate = new Date(2026, 6, 7, 14, 0, 0, 0);
assert.equal(
  resolvePreferredStart({ now: forensicBaseDate, preferredTimeText: "next Tuesday morning" })?.toDateString(),
  new Date(2026, 6, 14, 9, 0, 0, 0).toDateString(),
  "Next Tuesday should resolve to the following Tuesday, not today.",
);
assert.equal(
  resolvePreferredStart({ now: forensicBaseDate, preferredTimeText: "14th of July 9am" })?.getDate(),
  14,
  "Explicit date requests should be preserved.",
);
assert.equal(
  resolvePreferredStart({ now: forensicBaseDate, preferredTimeText: "14th of July 9am" })?.getHours(),
  9,
  "Explicit times after explicit dates should be preserved.",
);

console.log("ClinicFlow 20-conversation simulation smoke check passed");
