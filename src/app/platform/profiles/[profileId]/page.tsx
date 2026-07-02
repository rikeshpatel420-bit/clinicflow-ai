import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { getFlowPlatformProfile, getFlowPlatformProfileSummary, getFlowPlatformProfileSummaries, type FlowPlatformProfileId } from "@/lib/flow-platform";

export const dynamic = "force-dynamic";

function joinList(values: readonly string[]) {
  return values.length > 0 ? values.join(" • ") : "None";
}

export default async function PlatformProfilePage(props: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await props.params;
  const summaries = getFlowPlatformProfileSummaries();
  const isKnownProfile = summaries.some((item) => item.id === profileId);

  if (!isKnownProfile) notFound();

  const profile = getFlowPlatformProfile(profileId as FlowPlatformProfileId);
  const summary = getFlowPlatformProfileSummary(profileId as FlowPlatformProfileId);

  if (!profile || !summary) notFound();

  return (
    <PlatformShell
      active="/platform/profiles"
      eyebrow="Profile detail"
      title={profile.clinic.name}
      description={`Reusable Flow Platform profile for ${profile.industry.name.toLowerCase()} workflows.`}
    >
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Profile metadata</p>
              <h2 className="mt-2 text-xl font-semibold text-[#10201d]">{profile.clinic.name}</h2>
            </div>
            <span className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">{profile.id}</span>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-[#5b6662] sm:grid-cols-2">
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <span className="font-semibold text-[#10201d]">Industry</span>
              <p className="mt-1">{profile.industry.name}</p>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <span className="font-semibold text-[#10201d]">Locale</span>
              <p className="mt-1">{profile.clinic.locale}</p>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <span className="font-semibold text-[#10201d]">Voice</span>
              <p className="mt-1">{profile.conversation.voice.voice}</p>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <span className="font-semibold text-[#10201d]">Summary</span>
              <p className="mt-1">{summary.description}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/platform" className="rounded-md bg-[#10201d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a2f2b]">
              Back to platform
            </Link>
            <span className="rounded-md bg-[#f7faf9] px-4 py-2 text-sm font-semibold text-[#394642]">
              {summary.intentCount} intents · {summary.entityCount} entities · {summary.workflowCount} workflows
            </span>
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Conversation profile</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Profile behaviour</h2>
          <dl className="mt-4 grid gap-3 text-sm text-[#5b6662] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[#10201d]">Greeting</dt>
              <dd className="mt-1 leading-6">{profile.conversation.voice.greeting}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#10201d]">Closing</dt>
              <dd className="mt-1 leading-6">{profile.conversation.voice.closing}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#10201d]">Conversation tone</dt>
              <dd className="mt-1 leading-6">{profile.conversation.voice.conversationTone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#10201d]">Language</dt>
              <dd className="mt-1 leading-6">{profile.conversation.voice.language}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#10201d]">Business hours</dt>
              <dd className="mt-1 leading-6">{profile.clinic.businessHours}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#10201d]">Speech rate</dt>
              <dd className="mt-1 leading-6">{profile.conversation.voice.speechRate}</dd>
            </div>
          </dl>
        </article>
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Voice intents</p>
          <ul className="mt-4 grid gap-2 text-sm text-[#5b6662]">
            {profile.conversation.voice.intentDefinitions.map((intent) => (
              <li key={intent.intent} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <span className="font-semibold text-[#10201d]">{intent.label}</span>
                <p className="mt-1 text-xs leading-5">{intent.followUpQuestion}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#8d9794]">{joinList(intent.keywords)}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Lead intents</p>
          <ul className="mt-4 grid gap-2 text-sm text-[#5b6662]">
            {profile.conversation.leads.intentDefinitions.map((intent) => (
              <li key={intent.intent} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                <span className="font-semibold text-[#10201d]">{intent.label}</span>
                <p className="mt-1 text-xs leading-5">{intent.followUpQuestion}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#8d9794]">{joinList(intent.keywords)}</p>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Entities and workflows</p>
          <div className="mt-4 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#10201d]">Entities</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {[...profile.conversation.voice.entityDefinitions, ...profile.conversation.leads.entityDefinitions].map((entity) => (
                  <li key={entity.entity} className="rounded-full bg-[#f7faf9] px-3 py-1 text-xs font-semibold text-[#394642]">
                    {entity.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#10201d]">Workflows</h3>
              <ul className="mt-2 grid gap-2 text-sm text-[#5b6662]">
                {profile.workflows.map((workflow) => (
                  <li key={workflow.key} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#10201d]">{workflow.label}</span>
                      <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#65736f]">
                        {workflow.status ?? "draft"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5">{workflow.trigger}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8d9794]">
                      {workflow.conditions?.length ?? 0} conditions · {workflow.steps?.length ?? 0} steps · {workflow.actions?.length ?? 0} actions
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>
    </PlatformShell>
  );
}
