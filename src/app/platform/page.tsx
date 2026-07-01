import { redirect } from "next/navigation";
import { EventTable } from "@/components/platform/event-table";
import { JobBoard } from "@/components/platform/job-board";
import { ModuleCard } from "@/components/platform/module-card";
import { PlatformShell } from "@/components/platform/platform-shell";
import { platformConfig } from "@/lib/platform/config";
import { getActiveFlowPlatformProfile } from "@/lib/flow-platform";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const activeProfile = getActiveFlowPlatformProfile();
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
      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Active profile</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">{activeProfile.clinic.name}</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#5b6662] sm:grid-cols-2">
            <div>
              <span className="font-semibold text-[#10201d]">Industry</span>
              <p>{activeProfile.industry.name}</p>
            </div>
            <div>
              <span className="font-semibold text-[#10201d]">Profile ID</span>
              <p>{activeProfile.id}</p>
            </div>
            <div>
              <span className="font-semibold text-[#10201d]">Voice</span>
              <p>{activeProfile.conversation.voice.voice}</p>
            </div>
            <div>
              <span className="font-semibold text-[#10201d]">Locale</span>
              <p>{activeProfile.clinic.locale}</p>
            </div>
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Profile selection</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Environment-driven</h2>
          <p className="mt-3 text-sm leading-6 text-[#5b6662]">
            The runtime resolves the active product profile from <code className="font-semibold text-[#10201d]">FLOW_PLATFORM_PROFILE_ID</code> and falls back to ClinicFlow.
          </p>
        </article>
      </section>
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

