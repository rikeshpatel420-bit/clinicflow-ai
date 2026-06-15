import { redirect } from "next/navigation";
import { KpiGrid } from "@/components/performance/kpi-grid";
import { OpportunityList } from "@/components/performance/opportunity-list";
import { PerformanceShell } from "@/components/performance/performance-shell";
import { RiskIndicator } from "@/components/performance/risk-indicator";
import { TrendPlaceholder } from "@/components/performance/trend-placeholder";
import { performanceDemo } from "@/lib/performance/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PerformanceShell
      active="/performance"
      eyebrow="Clinic performance operating system"
      title="Owner performance command center"
      description="Daily score, revenue impact, retention opportunities, bottlenecks, and operating trends that clinic owners can check every day."
    >
      <section className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#72e5d3]">Clinic health score</p>
        <p className="mt-3 text-6xl font-semibold">{performanceDemo.healthScore}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Composite score from conversion, retention, no-show risk, and unresolved revenue exposure.</p>
      </section>

      <KpiGrid items={performanceDemo.executiveKpis} />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Trend monitoring</h2>
          <div className="mt-5">
            <TrendPlaceholder items={performanceDemo.trends} />
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Reactivation opportunity engine</h2>
          <div className="mt-5">
            <OpportunityList items={performanceDemo.opportunities} />
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Operational bottlenecks</h2>
          <div className="mt-4 grid gap-3">
            {performanceDemo.bottlenecks.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{item.label}</p>
                  <RiskIndicator level={item.severity} />
                </div>
                <p className="mt-2 text-sm text-[#65736f]">{item.impact}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Owner weekly summary</h2>
          <div className="mt-4 grid gap-3">
            {performanceDemo.weeklySummary.map((item) => (
              <p key={item} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{item}</p>
            ))}
          </div>
        </article>
      </section>
    </PerformanceShell>
  );
}

