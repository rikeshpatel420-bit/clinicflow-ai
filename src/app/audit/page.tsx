import { redirect } from "next/navigation";
import { EnterpriseAuditTimeline } from "@/components/enterprise/audit-timeline";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { enterpriseDemo } from "@/lib/enterprise/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <EnterpriseShell
      active="/audit"
      eyebrow="Enterprise audit logs"
      title="Organisation-wide audit timeline"
      description="Audit-safe timeline for governance, reporting, role visibility, and regional operating changes."
    >
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <EnterpriseAuditTimeline items={enterpriseDemo.audit} />
      </section>
    </EnterpriseShell>
  );
}

