import { redirect } from "next/navigation";
import { OpportunityCard } from "@/components/revenue-ops/opportunity-card";
import { RevenueOpsShell } from "@/components/revenue-ops/revenue-ops-shell";
import { revenueOpsDemo } from "@/lib/revenue-ops/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReactivationPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const items = revenueOpsDemo.opportunities.filter((item) => item.type === "inactive_patient");

  return (
    <RevenueOpsShell
      active="/reactivation"
      eyebrow="Inactive patient reactivation"
      title="Recurring retention opportunities"
      description="Demo reactivation engine for dormant patients, recall gaps, and repeat booking recovery."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <OpportunityCard key={item.id} item={item} />
        ))}
      </section>
    </RevenueOpsShell>
  );
}

