import Link from "next/link";
import { redirect } from "next/navigation";
import { analyticsDemo, formatAnalyticsCurrency } from "@/lib/analytics/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8">
        <header className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#72e5d3]">Executive command center</p>
              <h1 className="mt-3 text-4xl font-semibold">Money recovered this month</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                Demo analytics for clinic owners: revenue attribution, missed revenue, staff performance, conversion, and retention signals.
              </p>
            </div>
            <div>
              <p className="text-5xl font-semibold">{formatAnalyticsCurrency(analyticsDemo.recovery.revenueRecovered / 100)}</p>
              <p className="mt-2 text-sm text-white/65">Projected monthly ROI: {formatAnalyticsCurrency(analyticsDemo.recovery.monthlyProjection / 100)}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["AI recovery success", "64%", "replies to booked"],
            ["Conversion rate", `${analyticsDemo.recovery.conversionRate}%`, "pipeline close rate"],
            ["Avg patient LTV", formatAnalyticsCurrency(analyticsDemo.patientLifetimeValue.average), "demo estimate"],
            ["Pipeline forecast", formatAnalyticsCurrency(analyticsDemo.recovery.moneyLeftOnTable / 100), "open opportunity"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-[#65736f]">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#10201d]">{value}</p>
              <p className="mt-2 text-sm text-[#087968]">{note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Missed revenue trends</h2>
            <div className="mt-5 grid gap-3">
              {analyticsDemo.missedRevenueTrend.map((item) => (
                <div key={item.month} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-sm">
                  <p className="font-semibold text-[#10201d]">{item.month}</p>
                  <div className="h-3 rounded-md bg-[#edf2f0]">
                    <div className="h-3 rounded-md bg-[#18b7a0]" style={{ width: `${Math.min(100, item.recovered / 100)}%` }} />
                  </div>
                  <p className="font-semibold text-[#087968]">{formatAnalyticsCurrency(item.recovered)}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Appointment conversion funnel</h2>
            <div className="mt-5 grid gap-3">
              {analyticsDemo.appointmentFunnel.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-medium text-[#394642]">{item.label}</p>
                  <p className="text-2xl font-semibold text-[#10201d]">{item.value}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Revenue attribution</h2>
            <div className="mt-4 grid gap-3">
              {analyticsDemo.attribution.map((item) => (
                <div key={item.channel} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">{item.channel}</p>
                  <p className="mt-1 text-sm text-[#65736f]">{formatAnalyticsCurrency(item.revenue)} / {item.share}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Staff performance</h2>
            <div className="mt-4 grid gap-3">
              {analyticsDemo.staffPerformance.map((item) => (
                <div key={item.name} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">{item.name}</p>
                  <p className="mt-1 text-sm text-[#65736f]">{item.responseTime} response / {item.conversion} conversion</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Top missed-call sources</h2>
            <div className="mt-4 grid gap-3">
              {analyticsDemo.topSources.map((item) => (
                <div key={item.source} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">{item.source}</p>
                  <p className="mt-1 text-sm text-[#65736f]">{item.missed} missed / {formatAnalyticsCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Multi-location readiness</h2>
            <div className="mt-4 grid gap-3">
              {analyticsDemo.locations.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">{item.name}</p>
                  <p className="text-sm text-[#65736f]">{formatAnalyticsCurrency(item.recovered)} / {item.conversion}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Clinic growth insights</h2>
            <div className="mt-4 grid gap-3">
              {analyticsDemo.clinicGrowthInsights.map((item) => (
                <p key={item} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{item}</p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white">Export report</button>
              <Link href="/recovery" className="rounded-md border border-[#cdd8d5] px-4 py-3 text-sm font-semibold hover:border-[#0a8f7b]">
                View recovery pipeline
              </Link>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
