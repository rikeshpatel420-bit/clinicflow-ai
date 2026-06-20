import type { Call } from "@/types/database";
import { recoveryStatusLabels, recoveryToneByStatus } from "@/lib/calls/recovery";

const toneByStatus: Record<Call["status"], string> = {
  answered: "bg-blue-50 text-blue-700",
  abandoned: "bg-slate-100 text-slate-700",
  failed: "bg-red-50 text-red-700",
  missed: "bg-amber-50 text-amber-800",
  queued: "bg-slate-100 text-slate-700",
  recovered: "bg-[#e9faf6] text-[#087968]",
  voicemail: "bg-purple-50 text-purple-700",
};

export function CallStatusBadge({ status }: { status: Call["status"] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${toneByStatus[status]}`}>{label}</span>;
}

export function RecoveryStatusBadge({ status }: { status: Call["recovery_status"] }) {
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${recoveryToneByStatus[status]}`}>
      {recoveryStatusLabels[status]}
    </span>
  );
}
