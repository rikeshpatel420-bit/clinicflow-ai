import type { RiskLevel } from "@/lib/performance/engine";

const tone: Record<RiskLevel, string> = {
  critical: "bg-[#fee2e2] text-[#991b1b]",
  high: "bg-[#ffedd5] text-[#9a3412]",
  low: "bg-[#e8f8f4] text-[#087968]",
  medium: "bg-[#fef9c3] text-[#854d0e]",
};

export function RiskIndicator({ level }: { level: RiskLevel }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone[level]}`}>{level}</span>;
}

