import { redirect } from "next/navigation";
import { IntelligenceShell } from "@/components/intelligence/intelligence-shell";
import { RecommendationFeed } from "@/components/intelligence/recommendation-feed";
import { intelligenceDemo } from "@/lib/intelligence/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntelligenceShell
      active="/insights"
      eyebrow="Growth opportunity insights"
      title="What the clinic should do next"
      description="Recommendation structure for revenue recovery, patient retention, bottleneck removal, and conversion improvement."
    >
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <RecommendationFeed items={intelligenceDemo.recommendations} />
      </section>
    </IntelligenceShell>
  );
}

