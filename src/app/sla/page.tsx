import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { LocationTable } from "@/components/enterprise/location-table";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SlaPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/sla"
      eyebrow="SLA monitoring"
      title="Enterprise SLA and alerting"
      description="Group-wide SLA visibility for callback speed, escalation handling, and location-level operational discipline."
    >
      <LocationTable locations={enterpriseDemo.locations} />
    </EnterpriseShell>
  );
}

