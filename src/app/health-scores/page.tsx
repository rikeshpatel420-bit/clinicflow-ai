import { redirect } from "next/navigation";
import { AnalyticsShell } from "@/components/analytics-engine/analytics-shell";
import { analyticsEngineDemo } from "@/lib/analytics-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HealthScoresPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AnalyticsShell
      active="/health-scores"
      eyebrow="Clinic health scoring"
      title="Health score breakdown"
      description="Composite health score structure across revenue, retention, utilisation, and communication SLA."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {analyticsEngineDemo.healthScores.map((item) => (
          <article key={item.area} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{item.signal}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{item.area}</h2>
            <p className="mt-4 text-5xl font-semibold text-[#10201d]">{item.score}</p>
          </article>
        ))}
      </section>
    </AnalyticsShell>
  );
}

