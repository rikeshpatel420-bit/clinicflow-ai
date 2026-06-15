import { redirect } from "next/navigation";
import { AnalyticsKpiGrid } from "@/components/analytics-engine/analytics-kpi-grid";
import { AnalyticsShell } from "@/components/analytics-engine/analytics-shell";
import { ChartBlock } from "@/components/analytics-engine/chart-block";
import { analyticsEngineDemo } from "@/lib/analytics-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsEnginePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AnalyticsShell
      active="/analytics-engine"
      eyebrow="Analytics intelligence"
      title="Operational intelligence engine"
      description="Forecasting, attribution, LTV, no-show risk, funnel analytics, KPI reporting, and AI-ready analytics preparation."
    >
      <AnalyticsKpiGrid items={analyticsEngineDemo.executiveKpis} />
      <section className="grid gap-6 lg:grid-cols-2">
        <ChartBlock title="Conversion funnel analytics" items={analyticsEngineDemo.funnel} />
        <ChartBlock title="Trend analysis infrastructure" items={analyticsEngineDemo.trends} />
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <ChartBlock title="Staff performance analytics" items={analyticsEngineDemo.staffPerformance} />
        <ChartBlock title="Appointment utilisation" items={analyticsEngineDemo.appointmentUtilisation} />
        <ChartBlock title="Retention and churn indicators" items={analyticsEngineDemo.retentionIndicators} />
      </section>
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#10201d]">Campaign attribution modelling</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {analyticsEngineDemo.attribution.map((item) => (
            <article key={item.source} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="font-semibold text-[#10201d]">{item.source}</p>
              <p className="mt-2 text-2xl font-semibold text-[#10201d]">GBP {item.revenue.toLocaleString("en-GB")}</p>
              <p className="mt-1 text-sm text-[#65736f]">{item.bookings} bookings attributed</p>
            </article>
          ))}
        </div>
      </section>
    </AnalyticsShell>
  );
}
