import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { getFlowPlatformHealthSnapshot, getFlowPlatformProfileSummaries, getFlowPlatformProfileValidationSummaries } from "@/lib/flow-platform";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlatformProfilesPage() {
  const user = await getCurrentUser();
  const { isSupabaseConfigured } = getSupabaseEnv();
  if (isSupabaseConfigured && !user) redirect("/login");

  const profileSummaries = getFlowPlatformProfileSummaries();
  const validations = getFlowPlatformProfileValidationSummaries();
  const health = getFlowPlatformHealthSnapshot();
  const validationMap = new Map(validations.map((item) => [item.id, item]));
  const readyCount = validations.filter((item) => item.platformReady).length;

  return (
    <PlatformShell
      active="/platform/profiles"
      eyebrow="Flow Factory output"
      title="Installed Flow products"
      description="A profile comparison view that proves the platform can generate multiple production-ready verticals without duplicating core logic."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Installed products</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{profileSummaries.length}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Ready profiles</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{readyCount}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Workflow count</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{health.workflowCount}</p>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Template count</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{health.templateSummary.templateCount}</p>
        </article>
      </section>

      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Platform inheritance</p>
            <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Every product inherits the same core</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5b6662]">
              Each Flow product keeps the shared platform services, then swaps only its own profile configuration for voice, wording, workflows, templates, and
              dashboard labels.
            </p>
          </div>
          <div className="rounded-md bg-[#f7faf9] px-3 py-2 text-xs font-semibold text-[#394642]">
            Version {health.version} | {health.smokeStatus === "passing" ? "Smoke passing" : "Smoke attention"}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#f7faf9] text-[#65736f]">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Industry</th>
                <th className="px-4 py-3 font-semibold">Voice</th>
                <th className="px-4 py-3 font-semibold">Automation</th>
                <th className="px-4 py-3 font-semibold">Workflows</th>
                <th className="px-4 py-3 font-semibold">Templates</th>
                <th className="px-4 py-3 font-semibold">Health</th>
                <th className="px-4 py-3 font-semibold">Inheritance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f0]">
              {profileSummaries.map((profile) => {
                const validation = validationMap.get(profile.id);
                return (
                  <tr key={profile.id}>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-[#10201d]">{profile.name}</span>
                        <Link href={`/platform/profiles/${profile.id}`} className="text-xs font-semibold text-[#087968] hover:underline">
                          Open profile
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#394642]">{profile.industry}</td>
                    <td className="px-4 py-4 text-[#394642]">{profile.voice}</td>
                    <td className="px-4 py-4 text-[#394642]">{validation?.automationProfile ?? "Workflow-driven automation"}</td>
                    <td className="px-4 py-4 text-[#394642]">{profile.workflowCount}</td>
                    <td className="px-4 py-4 text-[#394642]">{profile.templateCount}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          validation?.status === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {validation?.status === "ready" ? "Ready" : "Attention"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#394642]">{validation?.inheritance ?? "Shared Flow Platform core"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {validations.map((profile) => (
          <article key={profile.id} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#087968]">{profile.industry}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{profile.name}</h2>
              </div>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  profile.platformReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {profile.platformReady ? "Ready" : "Attention"}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm text-[#5b6662] sm:grid-cols-2">
              <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
                <dt className="font-semibold text-[#10201d]">Voice profile</dt>
                <dd className="mt-1">{profile.voice}</dd>
              </div>
              <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
                <dt className="font-semibold text-[#10201d]">Automation profile</dt>
                <dd className="mt-1">{profile.automationProfile}</dd>
              </div>
              <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
                <dt className="font-semibold text-[#10201d]">Workflows</dt>
                <dd className="mt-1">{profile.workflowCount}</dd>
              </div>
              <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-3">
                <dt className="font-semibold text-[#10201d]">Templates</dt>
                <dd className="mt-1">{profile.templateCount}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[#10201d]">Validation checks</p>
              <div className="mt-3 grid gap-2">
                {profile.checks.map((check) => (
                  <div key={check.id} className={`rounded-md border px-3 py-2 text-sm ${check.ok ? "border-[#d9f3eb] bg-[#f4fbf8]" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#10201d]">{check.label}</span>
                      <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${check.ok ? "text-emerald-700" : "text-amber-700"}`}>
                        {check.ok ? "Complete" : "Missing"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#5b6662]">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {profile.missing.length > 0 ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Missing: {profile.missing.join(", ")}
              </p>
            ) : (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                All required profile sections are present.
              </p>
            )}
          </article>
        ))}
      </section>
    </PlatformShell>
  );
}
