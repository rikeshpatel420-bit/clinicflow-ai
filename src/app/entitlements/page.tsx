import { redirect } from "next/navigation";
import { BillingShell } from "@/components/billing/billing-shell";
import { EntitlementTable } from "@/components/billing/entitlement-table";
import { billingDemo } from "@/lib/billing/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EntitlementsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <BillingShell
      active="/entitlements"
      eyebrow="Feature entitlements"
      title="Plan access and capability controls"
      description="Feature entitlement model for plan limits, enterprise controls, and agency/client billing separation."
    >
      <EntitlementTable rows={billingDemo.entitlements} />
    </BillingShell>
  );
}

