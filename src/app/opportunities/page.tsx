import { redirect } from "next/navigation";
import { OpportunityCard } from "@/components/revenue-ops/opportunity-card";
import { RevenueOpsShell } from "@/components/revenue-ops/revenue-ops-shell";
import { revenueOpsDemo } from "@/lib/revenue-ops/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <RevenueOpsShell
      active="/opportunities"
      eyebrow="Opportunity scoring"
      title="Revenue opportunity engine"
      description="Score-weighted opportunity list covering missed calls, treatment recovery, cancellations, no-show risks, and reactivation."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {revenueOpsDemo.opportunities.map((item) => (
          <OpportunityCard key={item.id} item={item} />
        ))}
      </section>
    </RevenueOpsShell>
  );
}

