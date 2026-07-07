import { strict as assert } from "node:assert";
import { buildFfmpegAudioNormalizationArgs, getTwilioAudioNormalizationProfile } from "../src/lib/twilio/audio-normalization";
import { analyzeVoiceCallQuality, buildVoiceCallTurnTelemetry, detectVoiceCallPhrases } from "../src/lib/twilio/call-quality";

const reportedLiveCall = analyzeVoiceCallQuality({
  assistantMessages: ["I can take the details now and the practice will confirm the exact appointment by text or phone."],
  assistantWaitMs: 2400,
  bookingFieldsCollected: {
    appointmentType: true,
    fullName: true,
    mobileNumber: true,
    preferredDateTime: false,
  },
  deadAirMs: 48_000,
  totalCallDurationMs: 87_700,
});

assert(!reportedLiveCall.passed, "The reported live-call quality profile should fail the smoke test.");
assert(reportedLiveCall.deadAirRatio > 0.4, "Dead air above 40% should be flagged.");
assert(reportedLiveCall.details.some((detail) => detail.includes("Assistant wait time")), "Assistant waits over 2 seconds should be flagged.");

const prematureConfirmation = analyzeVoiceCallQuality({
  assistantMessages: ["Thanks, I've got the details."],
  assistantWaitMs: 800,
  bookingFieldsCollected: {
    appointmentType: true,
    fullName: false,
    mobileNumber: true,
    preferredDateTime: false,
  },
  deadAirMs: 5_000,
  totalCallDurationMs: 60_000,
});

assert(!prematureConfirmation.passed, "Premature booking-detail confirmation should fail.");
assert(prematureConfirmation.prematureConfirmation, "Premature confirmation should be reported explicitly.");

const healthyCall = analyzeVoiceCallQuality({
  assistantMessages: ["Perfect. I can offer Tuesday morning. Would you like me to book that?"],
  assistantWaitMs: 850,
  bookingFieldsCollected: {
    appointmentType: true,
    fullName: true,
    mobileNumber: true,
    preferredDateTime: true,
  },
  deadAirMs: 18_000,
  totalCallDurationMs: 90_000,
});

assert(healthyCall.passed, "A concise call with less than 40% dead air and sub-2s turn waits should pass.");

const telemetry = buildVoiceCallTurnTelemetry({
  assistantResponseEndedAt: new Date("2026-07-07T09:00:04.500Z"),
  assistantResponseStartedAt: new Date("2026-07-07T09:00:03.800Z"),
  assistantResponseText: "Of course. What time would suit you best?",
  callSid: "CA_test",
  callerSpeechDurationMs: 1200,
  callerSpeechEndedAt: new Date("2026-07-07T09:00:03.000Z"),
  callerSpeechStartedAt: new Date("2026-07-07T09:00:01.800Z"),
  clinicId: "clinic_test",
  speechText: "Can you book me now and send me a text to this number?",
  stage: "booking-day",
});

assert.equal(telemetry.silenceGapMs, 800, "Turn telemetry should capture the assistant wait after caller speech ends.");
assert.equal(telemetry.heardPhrases.bookMeNow, true, "Telemetry should detect booking-now requests.");
assert.equal(telemetry.heardPhrases.sendMeAText, true, "Telemetry should detect SMS requests.");
assert.equal(telemetry.heardPhrases.thisNumber, true, "Telemetry should detect 'this number' phrasing.");

const phrases = detectVoiceCallPhrases("Please use this number and send me a text.");
assert(phrases.thisNumber && phrases.sendMeAText, "Phrase detector should catch common live-call instructions.");

const profile = getTwilioAudioNormalizationProfile();
assert.equal(profile.channelLayout, "mono", "Audio normalisation should target mono speech.");
assert.equal(profile.highPassHz, 80, "Audio normalisation should apply a light 80Hz high-pass filter.");
assert(profile.targetIntegratedLufs <= -16 && profile.targetIntegratedLufs >= -18, "Audio normalisation should target -16 to -18 LUFS.");
assert.equal(profile.truePeakDb, -2, "Audio normalisation should protect true peak around -2 dB.");

const ffmpegArgs = buildFfmpegAudioNormalizationArgs("in.wav", "out.wav").join(" ");
assert(ffmpegArgs.includes("-ac 1"), "FFmpeg normalisation args should convert to mono.");
assert(ffmpegArgs.includes("highpass=f=80"), "FFmpeg normalisation args should include the 80Hz high-pass.");
assert(ffmpegArgs.includes("loudnorm=I=-17:TP=-2"), "FFmpeg normalisation args should include LUFS and true-peak targets.");

console.log("ClinicFlow call quality smoke check passed");
