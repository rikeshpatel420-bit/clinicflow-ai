import { EmptyState } from "@/components/ui/empty-state";
import type { MissedCallRow } from "@/lib/dashboard/live-data";

function formatState(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function MissedCallsTable({ rows }: { rows: MissedCallRow[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent missed calls</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Live missed-call records joined with recovery workflow and SMS event status where available.
        </p>
      </div>

      {rows.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Lead</th>
              <th className="px-5 py-3 font-semibold">Received</th>
              <th className="px-5 py-3 font-semibold">Workflow state</th>
              <th className="px-5 py-3 font-semibold">SMS status</th>
              <th className="px-5 py-3 font-semibold">Waiting for</th>
              <th className="px-5 py-3 font-semibold">Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{row.leadLabel}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{row.receivedAt}</td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-400/10 dark:text-teal-200">
                    {formatState(row.recoveryState)}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{row.smsStatus ?? "No SMS event"}</td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{row.waitingFor}</td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{row.sourceTable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="p-5">
          <EmptyState title="No missed calls" message="Real missed calls will appear here after call events are recorded." />
        </div>
      )}
    </section>
  );
}
