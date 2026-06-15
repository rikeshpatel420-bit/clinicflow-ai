import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganisationPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/organisation"
      eyebrow="Organisation management"
      title="Clinic hierarchy and master controls"
      description="Simulated hierarchy layer for groups, franchises, agencies, locations, and role-based visibility."
    >
      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["Organisation", enterpriseDemo.organisation.name],
          ["Structure", enterpriseDemo.organisation.structure],
          ["Visibility role", enterpriseDemo.organisation.role.replace("_", " ")],
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#10201d]">{value}</p>
          </article>
        ))}
      </section>
    </EnterpriseShell>
  );
}

