import { redirect } from "next/navigation";
import { BillingShell } from "@/components/billing/billing-shell";
import { UsageMeter } from "@/components/billing/usage-meter";
import { billingDemo } from "@/lib/billing/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UsagePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <BillingShell
      active="/usage"
      eyebrow="Usage metering"
      title="Account limits and quotas"
      description="Usage meters for clinics, seats, conversations, automations, and future usage-based packaging."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {billingDemo.usage.map((meter) => (
          <UsageMeter key={meter.key} meter={meter} />
        ))}
      </section>
    </BillingShell>
  );
}

