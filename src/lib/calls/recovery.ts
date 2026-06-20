import type { Call } from "@/types/database";

export type CallRecoveryStatus = Call["recovery_status"];

export const recoveryStatusLabels: Record<CallRecoveryStatus, string> = {
  awaiting_reply: "Awaiting reply",
  closed: "Closed",
  drafted: "Drafted",
  failed: "Failed",
  not_started: "Not started",
  queued: "Queued",
  replied: "Replied",
  recovered: "Recovered",
  booked: "Booked",
  lost: "Lost",
  sms_sent: "SMS sent",
  sms_draft: "SMS draft",
};

export const recoveryToneByStatus: Record<CallRecoveryStatus, string> = {
  awaiting_reply: "bg-blue-50 text-blue-700",
  closed: "bg-slate-100 text-slate-700",
  drafted: "bg-purple-50 text-purple-700",
  failed: "bg-red-50 text-red-700",
  booked: "bg-[#e8f8f4] text-[#087968]",
  lost: "bg-[#fee2e2] text-[#991b1b]",
  not_started: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-800",
  replied: "bg-blue-50 text-blue-700",
  recovered: "bg-[#e9faf6] text-[#087968]",
  sms_sent: "bg-teal-50 text-teal-700",
  sms_draft: "bg-purple-50 text-purple-700",
};

export function getInitialRecoveryState(callStatus: Call["status"]): {
  recovery_next_action: string | null;
  recovery_status: CallRecoveryStatus;
} {
  if (callStatus === "missed") {
    return {
      recovery_next_action: "Draft recovery SMS for staff review.",
      recovery_status: "queued",
    };
  }

  return {
    recovery_next_action: "No recovery needed.",
    recovery_status: "closed",
  };
}
