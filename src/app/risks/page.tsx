import { redirect } from "next/navigation";
import { AnomalyCard } from "@/components/intelligence/anomaly-card";
import { IntelligenceShell } from "@/components/intelligence/intelligence-shell";
import { intelligenceDemo } from "@/lib/intelligence/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RisksPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntelligenceShell
      active="/risks"
      eyebrow="Revenue risk detection"
      title="Operational anomalies and risk signals"
      description="Simulated anomaly layer for missed revenue, cancellation patterns, retention gaps, and operational bottlenecks."
    >
      <section className="grid gap-6 md:grid-cols-3">
        {intelligenceDemo.risks.map((item) => (
          <AnomalyCard key={item.label} item={item} />
        ))}
      </section>
    </IntelligenceShell>
  );
}

