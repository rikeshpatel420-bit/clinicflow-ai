export type VoiceCallPhraseFlags = {
  bookMeNow: boolean;
  sendMeAText: boolean;
  thisNumber: boolean;
};

export type VoiceCallTurnTelemetry = {
  assistantEstimatedSpeechDurationMs: number;
  assistantResponseEndedAt: string;
  assistantResponseLatencyMs: number;
  assistantResponseStartedAt: string;
  callSid: string | null;
  callerSpeechEndedAt: string | null;
  callerSpeechStartedAt: string;
  clinicId: string | null;
  heardPhrases: VoiceCallPhraseFlags;
  silenceGapMs: number | null;
  speechDurationMs: number | null;
  speechText: string;
  stage: string;
};

export type VoiceCallQualityAssessment = {
  assistantWaitMs: number;
  details: string[];
  deadAirRatio: number;
  passed: boolean;
  prematureConfirmation: boolean;
};

function normalizeSpeech(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function detectVoiceCallPhrases(text: string): VoiceCallPhraseFlags {
  const lower = normalizeSpeech(text);
  return {
    bookMeNow: /\b(can you book me now|book me now|book now|book it now|can you book)\b/i.test(lower),
    sendMeAText: /\b(send me a text|text me|send a text|send me the text)\b/i.test(lower),
    thisNumber: /\b(this number|my number|the number|use this number)\b/i.test(lower),
  };
}

export function buildVoiceCallTurnTelemetry(input: {
  assistantResponseEndedAt: Date;
  assistantResponseText: string;
  assistantResponseStartedAt: Date;
  callSid: string | null;
  callerSpeechDurationMs: number | null;
  callerSpeechEndedAt?: Date | null;
  callerSpeechStartedAt: Date;
  clinicId: string | null;
  speechText: string;
  stage: string;
}): VoiceCallTurnTelemetry {
  const callerSpeechEndedAt = input.callerSpeechEndedAt ?? (input.callerSpeechDurationMs ? new Date(input.callerSpeechStartedAt.getTime() + input.callerSpeechDurationMs) : null);
  const silenceGapMs = callerSpeechEndedAt ? Math.max(0, input.assistantResponseStartedAt.getTime() - callerSpeechEndedAt.getTime()) : null;
  const assistantEstimatedSpeechDurationMs = estimateAssistantSpeechDurationMs(input.assistantResponseText);
  const assistantResponseLatencyMs = callerSpeechEndedAt
    ? Math.max(0, input.assistantResponseStartedAt.getTime() - callerSpeechEndedAt.getTime())
    : Math.max(0, input.assistantResponseEndedAt.getTime() - input.callerSpeechStartedAt.getTime());

  return {
    assistantEstimatedSpeechDurationMs,
    assistantResponseEndedAt: input.assistantResponseEndedAt.toISOString(),
    assistantResponseLatencyMs,
    assistantResponseStartedAt: input.assistantResponseStartedAt.toISOString(),
    callSid: input.callSid,
    callerSpeechEndedAt: callerSpeechEndedAt ? callerSpeechEndedAt.toISOString() : null,
    callerSpeechStartedAt: input.callerSpeechStartedAt.toISOString(),
    clinicId: input.clinicId,
    heardPhrases: detectVoiceCallPhrases(input.speechText),
    silenceGapMs,
    speechDurationMs: input.callerSpeechDurationMs,
    speechText: input.speechText,
    stage: input.stage,
  };
}

export function estimateAssistantSpeechDurationMs(text: string) {
  const words = normalizeSpeech(text).split(" ").filter(Boolean).length;
  if (words === 0) {
    return 0;
  }

  return Math.ceil((words / 155) * 60_000);
}

export function analyzeVoiceCallQuality(input: {
  assistantMessages: string[];
  assistantWaitMs: number;
  bookingFieldsCollected: {
    appointmentType: boolean;
    fullName: boolean;
    mobileNumber: boolean;
    preferredDateTime: boolean;
  };
  deadAirMs: number;
  totalCallDurationMs: number;
}) {
  const deadAirRatio = input.totalCallDurationMs > 0 ? input.deadAirMs / input.totalCallDurationMs : 1;
  const prematureConfirmation = input.assistantMessages.some((message) => /i've got the details|i've got what i need|i have got the details/i.test(message)) && !Object.values(input.bookingFieldsCollected).every(Boolean);
  const details: string[] = [];

  if (deadAirRatio > 0.4) {
    details.push(`Dead air is ${(deadAirRatio * 100).toFixed(1)}% of the call.`);
  }

  if (input.assistantWaitMs > 2000) {
    details.push(`Assistant wait time is ${input.assistantWaitMs}ms.`);
  }

  if (prematureConfirmation) {
    details.push("Assistant confirmed details before collecting the booking basics.");
  }

  return {
    assistantWaitMs: input.assistantWaitMs,
    details,
    deadAirRatio,
    passed: details.length === 0,
    prematureConfirmation,
  } satisfies VoiceCallQualityAssessment;
}
