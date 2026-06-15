import type { ExecutionState } from "@/lib/automation-engine/types";

const tone: Record<ExecutionState, string> = {
  completed: "bg-[#e8f8f4] text-[#087968]",
  escalated: "bg-[#ffedd5] text-[#9a3412]",
  failed: "bg-[#fee2e2] text-[#991b1b]",
  pending: "bg-[#eef4f2] text-[#65736f]",
  retrying: "bg-[#fef9c3] text-[#854d0e]",
  running: "bg-[#ecfdf5] text-[#047857]",
  waiting: "bg-[#f7faf9] text-[#394642]",
};

export function ExecutionStatus({ state }: { state: ExecutionState }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone[state]}`}>{state}</span>;
}

