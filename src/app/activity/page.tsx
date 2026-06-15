import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/operations/activity-feed";
import { OpsShell } from "@/components/operations/ops-shell";
import { operationsDemo } from "@/lib/operations/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <OpsShell
      active="/activity"
      eyebrow="Real-time activity"
      title="Clinic activity stream"
      description="Live-simulated event model for patient, staff, appointment, recovery, and system activity."
    >
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">Activity model</p>
          <h2 className="mt-3 text-3xl font-semibold">Event-driven operations</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            This page models the future real-time stream that will connect Supabase events, call status updates, staff activity, and workflow state changes.
          </p>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Live activity feed</h2>
          <div className="mt-4">
            <ActivityFeed events={operationsDemo.activity} />
          </div>
        </article>
      </section>
    </OpsShell>
  );
}

