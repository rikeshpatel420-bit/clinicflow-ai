import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/compliance"
      eyebrow="Compliance dashboard"
      title="Operational compliance monitoring"
      description="Healthcare-safe compliance view for communication review, access checks, escalation handling, and audit completeness."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {enterpriseDemo.compliance.map((item) => (
          <article key={item.area} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[#10201d]">{item.area}</h2>
              <span className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#087968]">{item.status}</span>
            </div>
            <p className="mt-4 text-4xl font-semibold text-[#10201d]">{item.score}</p>
          </article>
        ))}
      </section>
    </EnterpriseShell>
  );
}

