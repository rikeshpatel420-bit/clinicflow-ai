import { redirect } from "next/navigation";
import { AutomationRunTimeline } from "@/components/automation-engine/automation-timeline";
import { AutomationShell } from "@/components/automation-engine/automation-shell";
import { RunTable } from "@/components/automation-engine/run-table";
import { automationEngineDemo } from "@/lib/automation-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExecutionPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AutomationShell
      active="/execution"
      eyebrow="Workflow execution"
      title="Execution control plane"
      description="Run state tracking, audit events, retry/backoff strategy, failure handling, and escalation routing."
    >
      <RunTable runs={automationEngineDemo.runs} />
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#10201d]">Automation run timeline</h2>
        <div className="mt-4">
          <AutomationRunTimeline items={automationEngineDemo.timeline} />
        </div>
      </section>
    </AutomationShell>
  );
}

