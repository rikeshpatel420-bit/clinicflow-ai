import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RegionalPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/regional"
      eyebrow="Regional performance"
      title="Regional trend analysis"
      description="Region-level revenue aggregation, trend monitoring, and operating comparison for group leaders."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {enterpriseDemo.regional.map((region) => (
          <article key={region.region} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{region.region}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">GBP {region.revenue.toLocaleString("en-GB")}</p>
            <p className="mt-2 text-sm text-[#65736f]">{region.clinics} clinic / {region.trend}</p>
          </article>
        ))}
      </section>
    </EnterpriseShell>
  );
}

