import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getActiveFlowPlatformProfile, getFlowPlatformProfileSummaries, getWorkflowOverviews } from "@/lib/flow-platform";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import type { AuditEvent } from "@/types/database";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | null) {
  if (!value) return "No runs yet";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function workflowMetadataValue(metadata: AuditEvent["metadata"], key: string) {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = metadata as Record<string, unknown>;
  const value = raw[key];
  return typeof value === "string" ? value : null;
}

export default async function PlatformWorkflowsPage() {
  const activeProfile = getActiveFlowPlatformProfile();
  const profileSummaries = getFlowPlatformProfileSummaries();
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) redirect("/login");

  const membership = user ? await getActiveClinicMembershipForUser(user) : null;
  const admin = createSupabaseAdminClient();

  const { data: auditEvents } = membership
    ? await admin
        .from("audit_events")
        .select("created_at,event_type,metadata,risk_level,entity_table")
        .eq("clinic_id", membership.clinic_id)
        .in("event_type", ["workflow.completed", "workflow.failed", "workflow.fallback", "workflow.run", "workflow.unmatched"])
        .order("created_at", { ascending: false })
        .limit(40)
        .returns<Pick<AuditEvent, "created_at" | "event_type" | "metadata" | "risk_level" | "entity_table">[]>()
    : { data: [] as Pick<AuditEvent, "created_at" | "event_type" | "metadata" | "risk_level" | "entity_table">[] };

  const workflowOverviews = getWorkflowOverviews(activeProfile, auditEvents ?? []);
  const latestRuns = workflowOverviews.map((workflow) => ({
    ...workflow,
    recentEvent: (auditEvents ?? []).find((event) => workflowMetadataValue(event.metadata, "workflow_key") === workflow.key),
  }));
  const activeWorkflowCount = workflowOverviews.filter((workflow) => workflow.status === "active").length;
  const uniqueTriggers = new Set(workflowOverviews.map((workflow) => workflow.trigger));

  return (
    <PlatformShell
      active="/platform/workflows"
      eyebrow="Workflow engine"
      title="Reusable workflow architecture"
      description="A profile-driven execution layer for calls, chats, bookings, enquiries, emergencies, follow-ups, and escalation."
    >
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Active profile</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-[#10201d]">{activeProfile.clinic.name}</h2>
            <span className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">{activeProfile.id}</span>
            <span className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">{activeWorkflowCount} active</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#5b6662]">
            The core engine resolves the active profile from <code className="font-semibold text-[#10201d]">FLOW_PLATFORM_PROFILE_ID</code> and runs only the workflows
            registered in that profile.
          </p>
          <dl className="mt-5 grid gap-3 text-sm text-[#5b6662] sm:grid-cols-2">
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <dt className="font-semibold text-[#10201d]">Industry</dt>
              <dd className="mt-1">{activeProfile.industry.name}</dd>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <dt className="font-semibold text-[#10201d]">Workflow triggers</dt>
              <dd className="mt-1">{uniqueTriggers.size}</dd>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <dt className="font-semibold text-[#10201d]">Voice profile</dt>
              <dd className="mt-1">{activeProfile.conversation.voice.voice}</dd>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
              <dt className="font-semibold text-[#10201d]">Last audit event</dt>
              <dd className="mt-1">{formatTimestamp(auditEvents?.[0]?.created_at ?? null)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Profile selection</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Configuration-first switching</h2>
          <p className="mt-3 text-sm leading-6 text-[#5b6662]">
            Switching products only changes configuration. The executor, dashboard, and webhook plumbing stay shared.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/factory" className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f2b]">
              Open Flow Factory
            </Link>
            <Link href="/platform" className="rounded-md border border-[#dce6e3] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] hover:bg-[#f7faf9]">
              View platform overview
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {workflowOverviews.map((workflow) => (
          <article key={workflow.key} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65736f]">{workflow.trigger}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{workflow.label}</h2>
              </div>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  workflow.status === "active" ? "bg-[#e9faf5] text-[#087968]" : "bg-[#f7faf9] text-[#65736f]"
                }`}
              >
                {workflow.status ?? "draft"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5b6662]">{workflow.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#65736f]">
              <div className="rounded-md bg-[#fafcfb] px-2 py-2">
                <dt className="font-semibold text-[#10201d]">Conditions</dt>
                <dd className="mt-1">{workflow.conditionCount}</dd>
              </div>
              <div className="rounded-md bg-[#fafcfb] px-2 py-2">
                <dt className="font-semibold text-[#10201d]">Steps</dt>
                <dd className="mt-1">{workflow.stepCount}</dd>
              </div>
              <div className="rounded-md bg-[#fafcfb] px-2 py-2">
                <dt className="font-semibold text-[#10201d]">Actions</dt>
                <dd className="mt-1">{workflow.actionCount}</dd>
              </div>
              <div className="rounded-md bg-[#fafcfb] px-2 py-2">
                <dt className="font-semibold text-[#10201d]">Last run</dt>
                <dd className="mt-1">{workflow.lastRunAt ? formatTimestamp(workflow.lastRunAt) : "No runs yet"}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3 text-sm text-[#5b6662]">
              <p className="font-semibold text-[#10201d]">Handler</p>
              <p className="mt-1 break-all">{workflow.handler}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Available profiles</p>
          <div className="mt-4 grid gap-3">
            {profileSummaries.map((profile) => {
              const isActive = profile.id === activeProfile.id;

              return (
                <Link
                  key={profile.id}
                  href={`/platform/profiles/${profile.id}`}
                  className={`rounded-md border px-4 py-3 transition ${
                    isActive ? "border-[#087968] bg-[#f2fbf8]" : "border-[#edf2f0] bg-[#fafcfb] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#65736f]">{profile.industry}</p>
                      <h3 className="mt-1 text-sm font-semibold text-[#10201d]">{profile.name}</h3>
                    </div>
                    <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#394642]">{profile.workflowCount} workflows</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Recent workflow events</p>
          {auditEvents && auditEvents.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {latestRuns.map((workflow) => {
                const recentEvent = workflow.recentEvent;
                return (
                  <div key={workflow.key} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#10201d]">{workflow.label}</p>
                        <p className="text-xs text-[#65736f]">{recentEvent?.event_type ?? "workflow.run"}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#65736f]">{workflow.lastRunAt ? formatTimestamp(workflow.lastRunAt) : "No runs yet"}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5b6662]">
                      {recentEvent ? `Event recorded at ${formatTimestamp(recentEvent.created_at)}.` : "No matching audit event recorded yet."}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-[#dce6e3] bg-[#fafcfb] px-4 py-6 text-sm text-[#65736f]">No activity yet</p>
          )}
        </article>
      </section>
    </PlatformShell>
  );
}
