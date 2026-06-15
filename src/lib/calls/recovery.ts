import type { Call } from "@/types/database";

export type CallRecoveryStatus = Call["recovery_status"];

export const recoveryStatusLabels: Record<CallRecoveryStatus, string> = {
  awaiting_reply: "Awaiting reply",
  closed: "Closed",
  failed: "Failed",
  not_started: "Not started",
  queued: "Queued",
  recovered: "Recovered",
  sms_draft: "SMS draft",
};

export const recoveryToneByStatus: Record<CallRecoveryStatus, string> = {
  awaiting_reply: "bg-blue-50 text-blue-700",
  closed: "bg-slate-100 text-slate-700",
  failed: "bg-red-50 text-red-700",
  not_started: "bg-slate-100 text-slate-700",
  queued: "bg-amber-50 text-amber-800",
  recovered: "bg-[#e9faf6] text-[#087968]",
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
