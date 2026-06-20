import type { DashboardMetricCard } from "@/lib/dashboard/live-data";

const toneClasses: Record<DashboardMetricCard["tone"], string> = {
  neutral: "text-slate-500 dark:text-slate-400",
  positive: "text-teal-700 dark:text-teal-300",
  warning: "text-amber-700 dark:text-amber-300",
};

export function DashboardMetricCardView({ metric }: { metric: DashboardMetricCard }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{metric.label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{metric.value}</p>
        <span className={`rounded-md px-2.5 py-1 text-right text-xs font-semibold ${toneClasses[metric.tone]}`}>{metric.change}</span>
      </div>
    </article>
  );
}
