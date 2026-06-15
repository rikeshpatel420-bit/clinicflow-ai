import Link from "next/link";
import { redirect } from "next/navigation";
import { EventTimeline } from "@/components/workflows/event-timeline";
import { MetricGrid } from "@/components/workflows/metric-grid";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { workflowDemo } from "@/lib/workflows/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8">
        <header className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">Workflow builder architecture</p>
          <h1 className="mt-3 text-4xl font-semibold">Operational nervous system</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">
            Demo-only workflow architecture for triggers, conditions, retries, escalation, and staff-approved automation.
          </p>
          <Link href="/automations" className="mt-6 inline-flex rounded-md bg-[#18b7a0] px-4 py-3 text-sm font-semibold text-[#071311]">
            View automation engine
          </Link>
        </header>

        <MetricGrid metrics={workflowDemo.metrics} />

        <section className="grid gap-6 lg:grid-cols-2">
          {workflowDemo.workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </section>

        <EventTimeline events={workflowDemo.auditLogs} />
      </section>
    </main>
  );
}
