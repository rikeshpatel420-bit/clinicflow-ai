import type { DashboardMetricCard } from "@/lib/dashboard/live-data";

const toneClasses: Record<DashboardMetricCard["tone"], string> = {
  neutral: "text-slate-500 dark:text-slate-400",
  positive: "text-teal-700 dark:text-teal-300",
  warning: "text-amber-700 dark:text-amber-300",
};

export function DashboardMetricCardView({ metric }: { metric: DashboardMetricCard }) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-teal-500 to-emerald-300" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{metric.label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-5xl font-semibold tracking-tight text-slate-950 dark:text-white">{metric.value}</p>
        <span className={`rounded-full px-3 py-1 text-right text-xs font-semibold ${toneClasses[metric.tone]}`}>{metric.change}</span>
      </div>
    </article>
  );
}
