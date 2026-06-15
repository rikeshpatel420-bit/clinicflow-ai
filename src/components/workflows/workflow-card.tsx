import type { WorkflowDefinition } from "@/lib/workflows/data";
import { StatusPill } from "./status-pill";

export function WorkflowCard({ workflow }: { workflow: WorkflowDefinition }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#10201d]">{workflow.name}</h2>
          <p className="mt-2 text-sm leading-6 text-[#65736f]">{workflow.objective}</p>
        </div>
        <StatusPill label={workflow.status} />
      </div>
      <div className="mt-5 grid gap-3">
        {workflow.nodes.map((node) => (
          <div key={node.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
            <p className="text-sm font-semibold text-[#10201d]">{node.label}</p>
            <p className="mt-1 text-sm text-[#65736f]">{node.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
