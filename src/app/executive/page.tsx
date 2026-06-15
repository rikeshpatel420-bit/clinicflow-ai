import { redirect } from "next/navigation";
import { BriefingPanel } from "@/components/intelligence/briefing-panel";
import { ExecutiveKpiGrid } from "@/components/intelligence/executive-kpi-grid";
import { IntelligenceShell } from "@/components/intelligence/intelligence-shell";
import { RecommendationFeed } from "@/components/intelligence/recommendation-feed";
import { intelligenceDemo } from "@/lib/intelligence/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExecutivePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntelligenceShell
      active="/executive"
      eyebrow="AI clinic COO"
      title="Executive decision system"
      description="Deterministic executive intelligence for clinic health, revenue risk, daily priorities, and owner-level operating decisions."
    >
      <ExecutiveKpiGrid items={intelligenceDemo.executiveKpis} />
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <BriefingPanel items={intelligenceDemo.morningBriefing} />
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Intelligent recommendation feed</h2>
          <div className="mt-4">
            <RecommendationFeed items={intelligenceDemo.recommendations} />
          </div>
        </article>
      </section>
    </IntelligenceShell>
  );
}

