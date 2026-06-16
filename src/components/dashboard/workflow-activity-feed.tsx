import { EmptyState } from "@/components/ui/empty-state";
import type { WorkflowActivityItem } from "@/lib/dashboard/live-data";

function statusTone(state: string) {
  const normalized = state.toLowerCase();

  if (normalized === "closed" || normalized === "booked" || normalized === "low") {
    return "bg-teal-500";
  }

  if (normalized === "failed" || normalized === "high") {
    return "bg-red-500";
  }

  return "bg-amber-500";
}

export function WorkflowActivityFeed({ items }: { items: WorkflowActivityItem[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Workflow activity</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live audit events and recovery workflow updates.</p>

      {items.length > 0 ? (
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="grid grid-cols-[auto_1fr] gap-3">
            <span className={`mt-1 size-2.5 rounded-full ${statusTone(item.state)}`} aria-hidden="true" />
            <div className="min-w-0 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 dark:border-slate-800">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.timestamp}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="No workflow activity" message="Audit and workflow events will appear here after real activity is recorded." />
        </div>
      )}
    </section>
  );
}
