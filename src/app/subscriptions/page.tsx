import { redirect } from "next/navigation";
import { BillingShell } from "@/components/billing/billing-shell";
import { billingDemo } from "@/lib/billing/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const subscription = billingDemo.subscription;

  return (
    <BillingShell
      active="/subscriptions"
      eyebrow="Subscription state machine"
      title="Tenant subscription lifecycle"
      description="Trial, active, past-due, paused, cancelled, upgrade, downgrade, and retention states modeled without payment provider calls."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {Object.entries(subscription).map(([label, value]) => (
          <article key={label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#10201d]">{String(value ?? "none")}</p>
          </article>
        ))}
      </section>
    </BillingShell>
  );
}

