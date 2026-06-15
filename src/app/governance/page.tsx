import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/governance"
      eyebrow="Operational governance"
      title="Enterprise controls and policy oversight"
      description="Governance layer for automation controls, role visibility, clinic operating rules, and reporting standards."
    >
      <section className="grid gap-4">
        {enterpriseDemo.governance.map((item) => (
          <article key={item.control} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-[#10201d]">{item.control}</h2>
              <span className="rounded-md bg-[#e8f8f4] px-2.5 py-1 text-xs font-semibold text-[#087968]">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-[#65736f]">Owner: {item.owner}</p>
          </article>
        ))}
      </section>
    </EnterpriseShell>
  );
}

