import { redirect } from "next/navigation";
import { AutomationShell } from "@/components/automation-engine/automation-shell";
import { RunTable } from "@/components/automation-engine/run-table";
import { automationEngineDemo } from "@/lib/automation-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AutomationRunsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AutomationShell
      active="/automation-runs"
      eyebrow="Automation run history"
      title="Run history and performance"
      description="Demo run history for execution outcomes, retries, escalations, and operational automation performance."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {automationEngineDemo.metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">{metric.value}</p>
            <p className="mt-2 text-sm font-semibold text-[#087968]">{metric.note}</p>
          </article>
        ))}
      </section>
      <RunTable runs={automationEngineDemo.runs} />
    </AutomationShell>
  );
}

