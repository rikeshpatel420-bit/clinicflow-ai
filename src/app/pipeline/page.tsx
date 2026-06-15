import { redirect } from "next/navigation";
import { ActionCenter } from "@/components/revenue-ops/action-center";
import { AutomationTimeline } from "@/components/revenue-ops/automation-timeline";
import { OpportunityCard } from "@/components/revenue-ops/opportunity-card";
import { RevenueOpsShell } from "@/components/revenue-ops/revenue-ops-shell";
import { revenueOpsDemo } from "@/lib/revenue-ops/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <RevenueOpsShell
      active="/pipeline"
      eyebrow="Autonomous revenue operations"
      title="Revenue pipeline control center"
      description="Demo automation layer for prioritising leads, recovering treatment, preventing no-shows, and routing revenue work to the front desk."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {revenueOpsDemo.metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">{metric.value}</p>
            <p className="mt-2 text-sm font-semibold text-[#087968]">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {revenueOpsDemo.opportunities.slice(0, 4).map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
        <div className="grid gap-6">
          <ActionCenter recommendations={revenueOpsDemo.recommendations} />
          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Automation timeline</h2>
            <div className="mt-4">
              <AutomationTimeline events={revenueOpsDemo.timeline} />
            </div>
          </article>
        </div>
      </section>
    </RevenueOpsShell>
  );
}

