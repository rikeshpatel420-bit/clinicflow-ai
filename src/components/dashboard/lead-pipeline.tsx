import { EmptyState } from "@/components/ui/empty-state";
import type { LeadPipelineColumn } from "@/lib/dashboard/live-data";

export function LeadPipeline({ columns }: { columns: LeadPipelineColumn[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Patient leads pipeline</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live lead stages from `patient_leads`.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          RLS scoped
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <div key={column.status} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column.title}</h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{column.leads.length}</span>
            </div>

            <div className="mt-3 grid gap-3">
              {column.leads.length > 0 ? column.leads.map((lead) => (
                <article key={lead.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{lead.label}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lead.nextAction}</p>
                    </div>
                    <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-400/10 dark:text-teal-200">
                      {lead.lead_score}
                    </span>
                  </div>
                </article>
              )) : (
                <EmptyState title={`No ${column.title.toLowerCase()} leads`} message="Real leads will appear here after capture." />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
