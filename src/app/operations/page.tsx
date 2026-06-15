import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/operations/activity-feed";
import { AlertTable } from "@/components/operations/alert-table";
import { ConversionHeatmap } from "@/components/operations/heatmap";
import { KpiTicker } from "@/components/operations/kpi-ticker";
import { OpsShell } from "@/components/operations/ops-shell";
import { WorkloadPanel } from "@/components/operations/workload-panel";
import { operationsDemo } from "@/lib/operations/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <OpsShell
      active="/operations"
      eyebrow="Live operations center"
      title="Clinic command desk"
      description="Live-simulated monitoring for callbacks, SLA risk, workload, activity, and daily owner priorities."
    >
      <section className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#72e5d3]">{operationsDemo.generatedAt}</p>
            <h2 className="mt-2 text-3xl font-semibold">Operational health score</h2>
          </div>
          <p className="text-6xl font-semibold">{operationsDemo.healthScore}</p>
        </div>
      </section>

      <KpiTicker items={operationsDemo.ticker} />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#10201d]">Urgent escalation dashboard</h2>
              <p className="mt-1 text-sm text-[#65736f]">Prioritised by severity, SLA status, and value at risk.</p>
            </div>
            <Link href="/alerts" className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white">View alerts</Link>
          </div>
          <div className="mt-5">
            <AlertTable alerts={operationsDemo.alerts.slice(0, 3)} />
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Daily executive briefing</h2>
          <div className="mt-4 grid gap-3">
            {operationsDemo.briefing.map((item) => (
              <p key={item} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{item}</p>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Task queue monitoring</h2>
          <div className="mt-4 grid gap-3">
            {operationsDemo.taskQueue.map((task) => (
              <div key={task.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{task.label}</p>
                  <p className="text-2xl font-semibold text-[#10201d]">{task.count}</p>
                </div>
                <p className="mt-1 text-sm text-[#65736f]">SLA {task.slaTarget} / {task.trend}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Staff workload balancing</h2>
          <div className="mt-4">
            <WorkloadPanel staff={operationsDemo.staff} />
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Live activity feed</h2>
          <div className="mt-4">
            <ActivityFeed events={operationsDemo.activity} />
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Communication status center</h2>
          <div className="mt-4 grid gap-3">
            {operationsDemo.communicationStatus.map((item) => (
              <div key={item.channel} className="flex items-center justify-between rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div>
                  <p className="font-semibold text-[#10201d]">{item.channel}</p>
                  <p className="mt-1 text-sm text-[#65736f]">{item.status}</p>
                </div>
                <p className="text-2xl font-semibold text-[#10201d]">{item.count}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Conversion heatmap</h2>
          <p className="mt-1 text-sm text-[#65736f]">Demo booking conversion pressure by day.</p>
          <div className="mt-5">
            <ConversionHeatmap items={operationsDemo.conversionHeatmap} />
          </div>
        </article>
      </section>
    </OpsShell>
  );
}

