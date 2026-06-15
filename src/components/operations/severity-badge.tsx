import type { AlertSeverity, SlaStatus } from "@/lib/operations/sla";

const severityTone: Record<AlertSeverity, string> = {
  critical: "bg-[#fee2e2] text-[#991b1b]",
  high: "bg-[#ffedd5] text-[#9a3412]",
  medium: "bg-[#fef9c3] text-[#854d0e]",
  low: "bg-[#e8f8f4] text-[#087968]",
};

const slaTone: Record<SlaStatus, string> = {
  at_risk: "bg-[#fef9c3] text-[#854d0e]",
  breached: "bg-[#fee2e2] text-[#991b1b]",
  within_sla: "bg-[#e8f8f4] text-[#087968]",
};

export function SeverityBadge({ value }: { value: AlertSeverity }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${severityTone[value]}`}>{value}</span>;
}

export function SlaBadge({ value }: { value: SlaStatus }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${slaTone[value]}`}>{value.replace("_", " ")}</span>;
}

