import { getInitialRecoveryState } from "@/lib/calls/recovery";

export type TwilioWebhookPayload = {
  CallSid?: string;
  CallStatus?: string;
  Called?: string;
  From?: string;
  To?: string;
};

const missedStatuses = new Set(["busy", "canceled", "failed", "no-answer"]);

export function parseTwilioFormData(formData: FormData): TwilioWebhookPayload {
  return {
    Called: String(formData.get("Called") ?? ""),
    CallSid: String(formData.get("CallSid") ?? ""),
    CallStatus: String(formData.get("CallStatus") ?? ""),
    From: String(formData.get("From") ?? ""),
    To: String(formData.get("To") ?? ""),
  };
}

export function detectMissedCall(payload: TwilioWebhookPayload) {
  const normalizedStatus = payload.CallStatus?.toLowerCase() ?? "";
  const isMissed = missedStatuses.has(normalizedStatus);
  const recovery = getInitialRecoveryState(isMissed ? "missed" : "answered");

  return {
    callSid: payload.CallSid || null,
    callerNumber: payload.From || null,
    clinicNumber: payload.To || payload.Called || null,
    isMissed,
    normalizedStatus,
    recovery,
  };
}
