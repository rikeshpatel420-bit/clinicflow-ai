import { redirect } from "next/navigation";
import { BillingShell } from "@/components/billing/billing-shell";
import { PlanCard } from "@/components/billing/plan-card";
import { billingDemo } from "@/lib/billing/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <BillingShell
      active="/plans"
      eyebrow="Subscription plans"
      title="Plan and seat pricing architecture"
      description="Plan structure, seat-based pricing, clinic allowances, and upgrade/downgrade foundation."
    >
      <section className="grid gap-6 md:grid-cols-3">
        {billingDemo.plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} />
        ))}
      </section>
    </BillingShell>
  );
}

