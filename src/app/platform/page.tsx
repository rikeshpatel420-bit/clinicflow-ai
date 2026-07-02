import Link from "next/link";
import { redirect } from "next/navigation";
import { EventTable } from "@/components/platform/event-table";
import { JobBoard } from "@/components/platform/job-board";
import { ModuleCard } from "@/components/platform/module-card";
import { PlatformShell } from "@/components/platform/platform-shell";
import { platformConfig } from "@/lib/platform/config";
import {
  buildFlowEventTopicSummary,
  buildFlowTemplateRegistry,
  buildNotificationRules,
  getActiveFlowPlatformProfile,
  getFlowPlatformHealthSnapshot,
  getFlowPlatformProfileSummaries,
} from "@/lib/flow-platform";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  const activeProfile = getActiveFlowPlatformProfile();
  const profileSummaries = getFlowPlatformProfileSummaries();
  const platformHealth = getFlowPlatformHealthSnapshot();
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const activeVoiceIntents = activeProfile.conversation.voice.intentDefinitions;
  const activeLeadIntents = activeProfile.conversation.leads.intentDefinitions;
  const activeVoiceEntities = activeProfile.conversation.voice.entityDefinitions;
  const activeLeadEntities = activeProfile.conversation.leads.entityDefinitions;
  const activeWorkflows = activeProfile.workflows;
  const activeTemplates = buildFlowTemplateRegistry(activeProfile);
  const activeNotifications = buildNotificationRules(activeProfile);
  const eventTopicSummary = buildFlowEventTopicSummary();

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
            <div>
              <span className="font-semibold text-[#10201d]">Templates</span>
              <p>{activeTemplates.templates.length}</p>
            </div>
            <div>
              <span className="font-semibold text-[#10201d]">Notifications</span>
              <p>{activeNotifications.length}</p>
            </div>
            <div>
              <span className="font-semibold text-[#10201d]">Event topics</span>
              <p>{eventTopicSummary.registeredTopics}</p>
            </div>
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Profile selection</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Environment-driven</h2>
          <p className="mt-3 text-sm leading-6 text-[#5b6662]">
            The runtime resolves the active product profile from <code className="font-semibold text-[#10201d]">FLOW_PLATFORM_PROFILE_ID</code> and falls back to ClinicFlow.
          </p>
          <div className="mt-4 rounded-lg border border-[#edf2f0] bg-[#fafcfb] p-4">
            <p className="text-sm font-semibold text-[#10201d]">Need a new product?</p>
            <p className="mt-1 text-sm leading-6 text-[#5b6662]">
              Use Flow Factory to generate a new configuration package, route plan, voice profile, documentation, and smoke tests without
              touching the shared platform code.
            </p>
            <Link href="/factory" className="mt-3 inline-flex rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f2b]">
              Open Flow Factory
            </Link>
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Platform health</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Reusable services</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#5b6662]">
            {platformHealth.health.map((item) => (
              <div key={item.service} className="rounded-lg border border-[#edf2f0] bg-[#fafcfb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{item.service}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.status === "operational" ? "bg-emerald-50 text-emerald-700" : item.status === "attention" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-[#edf2f0] bg-[#fafcfb] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Version</p>
              <p className="mt-2 font-semibold text-[#10201d]">{platformHealth.version}</p>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fafcfb] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Smoke status</p>
              <p className="mt-2 font-semibold text-[#10201d]">{platformHealth.smokeStatus}</p>
            </div>
          </div>
        </article>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Voice intents</p>
              <h2 className="mt-2 text-lg font-semibold text-[#10201d]">What the receptionist understands</h2>
            </div>
            <span className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">
              {activeVoiceIntents.length + activeLeadIntents.length} total
            </span>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-[#5b6662]">
            {activeVoiceIntents.map((intent) => (
              <li key={intent.intent} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <span className="font-semibold text-[#10201d]">{intent.label}</span>
                <p className="mt-1 text-xs leading-5">{intent.followUpQuestion}</p>
              </li>
            ))}
            {activeLeadIntents.map((intent) => (
              <li key={intent.intent} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <span className="font-semibold text-[#10201d]">{intent.label}</span>
                <p className="mt-1 text-xs leading-5">{intent.followUpQuestion}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Entities</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">What the platform extracts</h2>
          <ul className="mt-4 grid gap-2 text-sm text-[#5b6662]">
            {activeVoiceEntities.map((entity) => (
              <li key={entity.entity} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <span className="font-semibold text-[#10201d]">{entity.label}</span>
                <p className="mt-1 text-xs leading-5">{entity.entity}</p>
              </li>
            ))}
            {activeLeadEntities.map((entity) => (
              <li key={entity.entity} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <span className="font-semibold text-[#10201d]">{entity.label}</span>
                <p className="mt-1 text-xs leading-5">{entity.entity}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Workflows</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">How the profile behaves</h2>
          <ul className="mt-4 grid gap-2 text-sm text-[#5b6662]">
            {activeWorkflows.map((workflow) => (
              <li key={workflow.key} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#10201d]">{workflow.label}</span>
                  <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#65736f]">
                    {workflow.status ?? "draft"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5">{workflow.description}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#8d9794]">{workflow.trigger}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Installed profiles</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{platformHealth.availableProfiles}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Workflow count</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{platformHealth.workflowCount}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Template count</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{platformHealth.templateSummary.templateCount}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Notification rules</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{platformHealth.notificationSummary.count}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Registered triggers</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{platformHealth.triggerCount}</p>
        </article>
      </section>
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Available profiles</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">Switch the platform by profile</h2>
            <p className="mt-2 text-sm leading-6 text-[#5b6662]">
              These are the reusable verticals currently registered in the Flow Platform catalog.
            </p>
          </div>
          <div className="rounded-md bg-[#f7faf9] px-3 py-2 text-xs font-semibold text-[#394642]">
            Default: {activeProfile.id}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {profileSummaries.map((profile) => {
            const isActive = profile.id === activeProfile.id;

            return (
              <article
                key={profile.id}
                className={`rounded-lg border p-4 shadow-sm transition ${
                  isActive ? "border-[#087968] bg-[#f2fbf8]" : "border-[#dce6e3] bg-[#fcfdfd]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65736f]">{profile.industry}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#10201d]">{profile.name}</h3>
                  </div>
                  {isActive ? (
                    <span className="rounded-md bg-[#087968] px-2.5 py-1 text-xs font-semibold text-white">Active</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5b6662]">{profile.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#65736f]">
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Intents</dt>
                    <dd className="mt-1">{profile.intentCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Entities</dt>
                    <dd className="mt-1">{profile.entityCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Workflows</dt>
                    <dd className="mt-1">{profile.workflowCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Voice</dt>
                    <dd className="mt-1">{profile.voice}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Notifications</dt>
                    <dd className="mt-1">{profile.notificationCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Templates</dt>
                    <dd className="mt-1">{profile.templateCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Triggers</dt>
                    <dd className="mt-1">{profile.triggerCount}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#394642]">{profile.id}</span>
                  <Link
                    href={`/platform/profiles/${profile.id}`}
                    className="rounded-md bg-[#10201d] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f2b]"
                  >
                    View profile
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
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

