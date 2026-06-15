import type { AutomationRule } from "@/lib/automation-engine/types";

export function RuleCard({ rule }: { rule: AutomationRule }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#087968]">{rule.trigger.replace("_", " ")}</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{rule.name}</h2>
        </div>
        <span className="rounded-md bg-[#e8f8f4] px-2.5 py-1 text-xs font-semibold text-[#087968]">{rule.enabled ? "enabled" : "disabled"}</span>
      </div>
      <p className="mt-4 text-sm text-[#65736f]">Priority threshold {rule.priority}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {rule.actions.map((action) => (
          <span key={action} className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">
            {action.replace("_", " ")}
          </span>
        ))}
      </div>
    </article>
  );
}

