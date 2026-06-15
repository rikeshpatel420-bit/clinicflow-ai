import { redirect } from "next/navigation";
import { BriefingPanel } from "@/components/intelligence/briefing-panel";
import { IntelligenceShell } from "@/components/intelligence/intelligence-shell";
import { intelligenceDemo } from "@/lib/intelligence/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BriefingsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntelligenceShell
      active="/briefings"
      eyebrow="Executive summaries"
      title="Daily and weekly owner briefings"
      description="Healthcare-safe simulated briefing views that turn operations into concise owner decisions."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <BriefingPanel items={intelligenceDemo.morningBriefing} />
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Executive weekly summary</h2>
          <div className="mt-4 grid gap-3">
            {intelligenceDemo.weeklySummary.map((item) => (
              <p key={item} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{item}</p>
            ))}
          </div>
        </article>
      </section>
    </IntelligenceShell>
  );
}

