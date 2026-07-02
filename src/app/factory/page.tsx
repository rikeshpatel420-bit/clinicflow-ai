import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { FlowFactoryWizard } from "./factory-wizard";
import { getFlowFactoryBlueprintDefaults } from "@/lib/flow-factory";
import { getActiveFlowPlatformProfile, getFlowPlatformProfileSummaries } from "@/lib/flow-platform";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FactoryPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const activeProfile = getActiveFlowPlatformProfile();
  const profileSummaries = getFlowPlatformProfileSummaries();

  return (
    <PlatformShell
      active="/factory"
      eyebrow="Flow Factory"
      title="Generate a new Flow product from configuration"
      description="Create a new business package by filling in the blueprint. The platform turns it into routes, voice, dashboard, workflow, documentation, and smoke-test artifacts."
    >
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-[#dce6e3] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <p className="text-sm font-semibold text-[#087968]">Reusable platform</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">ClinicFlow is one profile, not the product.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#65736f]">
            Use Flow Factory to create a new vertical without touching the shared conversation engine, Twilio flows, or dashboard shell.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#edf2f0] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Active profile</p>
              <p className="mt-2 text-sm font-semibold text-[#10201d]">{activeProfile.clinic.name}</p>
            </div>
            <div className="rounded-2xl border border-[#edf2f0] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Registered profiles</p>
              <p className="mt-2 text-sm font-semibold text-[#10201d]">{profileSummaries.length}</p>
            </div>
            <div className="rounded-2xl border border-[#edf2f0] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Factory mode</p>
              <p className="mt-2 text-sm font-semibold text-[#10201d]">Configuration-first</p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <p className="text-sm font-semibold text-[#087968]">What the factory produces</p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#5d6d68]">
            <li className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">A new profile manifest for the chosen industry and business.</li>
            <li className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">Route suggestions, dashboard labels, voice guidance, and AI prompt copy.</li>
            <li className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">Documentation and smoke tests ready for a new vertical.</li>
          </ul>
        </article>
      </section>

      <FlowFactoryWizard
        activeProfileId={activeProfile.id}
        activeProfileName={activeProfile.clinic.name}
        availableProfiles={profileSummaries.length}
        defaultBlueprint={getFlowFactoryBlueprintDefaults()}
      />
    </PlatformShell>
  );
}
