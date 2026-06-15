import { redirect } from "next/navigation";
import { BenchmarkBoard } from "@/components/enterprise/benchmark-board";
import { EnterpriseMetricGrid } from "@/components/enterprise/enterprise-metric-grid";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { LocationTable } from "@/components/enterprise/location-table";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EnterprisePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/enterprise"
      eyebrow="Enterprise operating layer"
      title="Multi-clinic command center"
      description="Group-level oversight for single clinics, clinic groups, regional chains, franchise organisations, and enterprise healthcare operators."
    >
      <EnterpriseMetricGrid metrics={enterpriseDemo.metrics} />
      <LocationTable locations={enterpriseDemo.locations} />
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Cross-clinic benchmarking</h2>
          <div className="mt-4">
            <BenchmarkBoard items={enterpriseDemo.benchmarks} />
          </div>
        </article>
        <article className="rounded-lg bg-[#10201d] p-5 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">White-label readiness</p>
          <h2 className="mt-3 text-3xl font-semibold">{enterpriseDemo.organisation.whiteLabel}</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">Demo structure for agency-managed tenants, master controls, and role-based enterprise visibility.</p>
        </article>
      </section>
    </EnterpriseShell>
  );
}

