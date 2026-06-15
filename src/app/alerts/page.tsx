import { redirect } from "next/navigation";
import { AlertTable } from "@/components/operations/alert-table";
import { KpiTicker } from "@/components/operations/kpi-ticker";
import { OpsShell } from "@/components/operations/ops-shell";
import { SeverityBadge, SlaBadge } from "@/components/operations/severity-badge";
import { operationsDemo } from "@/lib/operations/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <OpsShell
      active="/alerts"
      eyebrow="Smart alert system"
      title="Unresolved patient alerts"
      description="Prioritised alert management for urgent callbacks, SLA breaches, appointment risks, and patient follow-up gaps."
    >
      <KpiTicker items={operationsDemo.ticker} />

      <section className="grid gap-4 md:grid-cols-4">
        {operationsDemo.alerts.map((alert) => (
          <article key={alert.id} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge value={alert.severity} />
              <SlaBadge value={alert.slaStatus} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#10201d]">{alert.patient}</h2>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">{alert.title}</p>
            <p className="mt-4 text-2xl font-semibold text-[#10201d]">GBP {alert.valueAtRisk}</p>
          </article>
        ))}
      </section>

      <AlertTable alerts={operationsDemo.alerts} />
    </OpsShell>
  );
}

