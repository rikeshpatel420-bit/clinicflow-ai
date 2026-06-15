import { redirect } from "next/navigation";
import { EventTable } from "@/components/platform/event-table";
import { JobBoard } from "@/components/platform/job-board";
import { ModuleCard } from "@/components/platform/module-card";
import { PlatformShell } from "@/components/platform/platform-shell";
import { platformConfig } from "@/lib/platform/config";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PlatformShell
      active="/platform"
      eyebrow="Platform infrastructure"
      title="Healthcare operations ecosystem foundation"
      description="Internal framework layer for modules, events, queues, providers, feature flags, branding, admin tooling, and API readiness."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {platformConfig.modules.map((module) => (
          <ModuleCard key={module.id} item={module} />
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <EventTable events={platformConfig.events} />
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Queue and scheduler</h2>
          <div className="mt-4">
            <JobBoard jobs={platformConfig.jobs} />
          </div>
        </article>
      </section>
    </PlatformShell>
  );
}

