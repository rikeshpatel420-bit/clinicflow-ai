import { redirect } from "next/navigation";
import { PerformanceShell } from "@/components/performance/performance-shell";
import { performanceDemo } from "@/lib/performance/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ForecastingPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PerformanceShell
      active="/forecasting"
      eyebrow="Missed revenue forecasting"
      title="Financial impact visualisation"
      description="Demo forecasting layer for recovered revenue, missed revenue reduction, and owner-facing ROI momentum."
    >
      <section className="grid gap-6 md:grid-cols-4">
        {performanceDemo.forecasting.map((item) => (
          <article key={item.month} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{item.month}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">GBP {item.recovered.toLocaleString("en-GB")}</p>
            <p className="mt-2 text-sm text-[#65736f]">Missed risk GBP {item.missed.toLocaleString("en-GB")}</p>
          </article>
        ))}
      </section>
    </PerformanceShell>
  );
}

