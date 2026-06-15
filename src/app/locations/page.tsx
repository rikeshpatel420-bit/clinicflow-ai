import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { LocationTable } from "@/components/enterprise/location-table";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/locations"
      eyebrow="Location management"
      title="Clinic comparison views"
      description="Location-level revenue, SLA, staff utilisation, and health visibility for enterprise operators."
    >
      <LocationTable locations={enterpriseDemo.locations} />
    </EnterpriseShell>
  );
}

