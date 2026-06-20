import { getInitialRecoveryState } from "@/lib/calls/recovery";
import type { Call } from "@/types/database";

export type TwilioWebhookPayload = {
  AnsweredBy?: string;
  Body?: string;
  CallDuration?: string;
  CallSid?: string;
  CallStatus?: string;
  Called?: string;
  Direction?: string;
  From?: string;
  MessageSid?: string;
  SmsStatus?: string;
  To?: string;
};

const missedStatuses = new Set(["busy", "canceled", "failed", "no-answer"]);
const answeredStatuses = new Set(["in-progress", "initiated", "ringing"]);
const abandonedStatuses = new Set(["abandoned"]);

export function parseTwilioFormData(formData: FormData): TwilioWebhookPayload {
  return {
    AnsweredBy: String(formData.get("AnsweredBy") ?? ""),
    Body: String(formData.get("Body") ?? ""),
    CallDuration: String(formData.get("CallDuration") ?? ""),
    CallSid: String(formData.get("CallSid") ?? ""),
    CallStatus: String(formData.get("CallStatus") ?? ""),
    Called: String(formData.get("Called") ?? ""),
    Direction: String(formData.get("Direction") ?? ""),
    From: String(formData.get("From") ?? ""),
    MessageSid: String(formData.get("MessageSid") ?? ""),
    SmsStatus: String(formData.get("SmsStatus") ?? ""),
    To: String(formData.get("To") ?? ""),
  };
}

export function classifyTwilioCall(payload: TwilioWebhookPayload) {
  const normalizedStatus = payload.CallStatus?.toLowerCase() ?? "";
  const answeredBy = payload.AnsweredBy?.toLowerCase() ?? "";
  const completedDetected = normalizedStatus === "completed";
  const voicemailDetected = answeredBy.includes("machine") || answeredBy.includes("fax");
  const abandonedDetected = abandonedStatuses.has(normalizedStatus);
  const missedDetected = missedStatuses.has(normalizedStatus);
  const answeredDetected = (answeredStatuses.has(normalizedStatus) || completedDetected) && !missedDetected && !voicemailDetected;
  const finalStatus: Call["status"] = voicemailDetected
    ? "voicemail"
    : abandonedDetected
      ? "abandoned"
      : missedDetected
        ? "missed"
        : answeredDetected
          ? "answered"
          : "queued";
  const recovery = getInitialRecoveryState(finalStatus === "missed" || finalStatus === "voicemail" || finalStatus === "abandoned" ? "missed" : "answered");

  return {
    answeredBy: answeredBy || null,
    callSid: payload.CallSid || null,
    callStatus: normalizedStatus,
    callerNumber: payload.From || null,
    clinicNumber: payload.To || payload.Called || null,
    finalStatus,
    isAbandoned: abandonedDetected,
    isAnswered: finalStatus === "answered",
    isMissed: finalStatus === "missed",
    isVoicemail: finalStatus === "voicemail",
    recovery,
  };
}
