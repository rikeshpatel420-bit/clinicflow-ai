import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EntitlementTable } from "@/components/billing/entitlement-table";
import { FeatureFlagList } from "@/components/platform/feature-flag-list";
import { PlatformShell } from "@/components/platform/platform-shell";
import { buildSaasFoundationSnapshot } from "@/lib/saas";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusClass(configured: boolean) {
  return configured ? "border-[#c8eee6] bg-[#f7fffd] text-[#087968]" : "border-amber-200 bg-amber-50 text-amber-800";
}

function statusLabel(configured: boolean) {
  return configured ? "Configured" : "Missing";
}

function buildEntitlementRows(
  tiers: readonly {
    features: string[];
    key: "starter" | "growth" | "enterprise";
  }[],
) {
  const featureNames = Array.from(new Set(tiers.flatMap((tier) => tier.features))).sort((left, right) => left.localeCompare(right));

  return featureNames.map((feature) => ({
    enterprise: tiers.find((tier) => tier.key === "enterprise")?.features.includes(feature) ?? false,
    feature,
    growth: tiers.find((tier) => tier.key === "growth")?.features.includes(feature) ?? false,
    starter: tiers.find((tier) => tier.key === "starter")?.features.includes(feature) ?? false,
  }));
}

export default async function PlatformFoundationPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? (forwardedHost && /localhost|127\.0\.0\.1/.test(forwardedHost) ? "http" : "https");
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const snapshot = await buildSaasFoundationSnapshot({ baseUrl, user });
  const entitlementRows = buildEntitlementRows(snapshot.billing.tiers);

  return (
    <PlatformShell
      active="/platform/foundation"
      eyebrow="SaaS foundation"
      title="Shared operating model for every Flow product"
      description="Tenancy, billing, roles, feature flags, audit, API keys, and workspace isolation all live in one reusable platform layer."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Installed profiles", value: snapshot.profiles.length, note: "Flow Factory output ready" },
          { label: "Platform modules", value: snapshot.platformModules.length, note: "Shared core services" },
          { label: "Billing tiers", value: snapshot.billing.tiers.length, note: "Commercial packaging" },
          { label: "Configured secrets", value: snapshot.apiKeys.filter((item) => item.configured).length, note: "Server-side only" },
        ].map((card) => (
          <article key={card.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">{card.value}</p>
            <p className="mt-2 text-sm text-[#65736f]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Workspace model</p>
              <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Clinic-scoped tenancy and isolation</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6662]">
                The current workspace context is resolved from the authenticated clinic membership, then filtered through the shared tenant scope
                helpers before any write or read path reaches a tenant-aware repository.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(Boolean(snapshot.readiness.clinic.id))}`}>
              {statusLabel(Boolean(snapshot.readiness.clinic.id))}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Current scope</p>
              <p className="mt-2 text-sm font-semibold text-[#10201d]">{snapshot.tenant.scopeLabel}</p>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Clinic filter</p>
              <p className="mt-2 break-all text-sm font-semibold text-[#10201d]">{JSON.stringify(snapshot.tenant.filter)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {snapshot.tenant.isolationRules.map((rule) => (
              <div key={rule} className="rounded-md border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3 text-sm leading-6 text-[#5b6662]">
                {rule}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Production readiness</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Go-live signals</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.readiness.steps.map((step) => (
              <div key={step.label} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{step.label}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      step.status === "complete"
                        ? "bg-[#e9faf5] text-[#087968]"
                        : step.status === "missing"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {step.value}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#65736f]">{step.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Commercial model</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Tiers, quotas, and entitlements</h2>
          <div className="mt-5 grid gap-3">
            {snapshot.billing.tiers.map((tier) => (
              <div key={tier.key} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10201d]">{tier.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#65736f]">{tier.priceEnvKey}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(tier.priceConfigured)}`}>
                    {statusLabel(tier.priceConfigured)}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#5b6662]">
                  <div className="rounded-md bg-white px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Clinics</dt>
                    <dd className="mt-1 font-semibold text-[#10201d]">{tier.clinicsIncluded}</dd>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Seats</dt>
                    <dd className="mt-1 font-semibold text-[#10201d]">{tier.usageLimit.seats}</dd>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Conversations</dt>
                    <dd className="mt-1 font-semibold text-[#10201d]">{tier.usageLimit.conversations}</dd>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Automations</dt>
                    <dd className="mt-1 font-semibold text-[#10201d]">{tier.usageLimit.automations}</dd>
                  </div>
                </dl>
                <ul className="mt-3 grid gap-1 text-sm text-[#5b6662]">
                  {tier.features.map((feature) => (
                    <li key={feature} className="rounded-md bg-white px-3 py-2">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <EntitlementTable rows={entitlementRows} />
          </div>
        </article>

        <article className="grid gap-6">
          <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">Platform controls</p>
            <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Feature flags and API keys</h2>
            <div className="mt-4 grid gap-4">
              {snapshot.apiKeys.map((item) => (
                <div key={item.key} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#10201d]">{item.label}</p>
                      <p className="mt-1 text-sm text-[#65736f]">{item.note}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9794]">
                        {item.key} / {item.scope}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.configured)}`}>
                      {statusLabel(item.configured)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">Feature flags</p>
            <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Rollout controls inherited by every product</h2>
            <div className="mt-4">
              <FeatureFlagList flags={[...snapshot.featureFlags]} />
            </div>
          </section>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Roles and permissions</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Shared authorisation matrix</h2>
          <div className="mt-5 grid gap-3">
            {snapshot.permissions.map((role) => (
              <div key={role.role} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10201d]">{role.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9794]">{role.permissionCount} permissions</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">{role.role}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <span key={permission} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#5b6662] ring-1 ring-[#edf2f0]">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Audit and integration surface</p>
          <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Operational coverage</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Audit categories</p>
              <p className="mt-2 text-2xl font-semibold text-[#10201d]">{snapshot.audit.categories.length}</p>
              <p className="mt-1 text-sm text-[#65736f]">Shared audit records for tenant, billing, webhook, and security checks.</p>
            </div>
            <div className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Providers</p>
              <p className="mt-2 text-2xl font-semibold text-[#10201d]">{snapshot.integrations.providerCount}</p>
              <p className="mt-1 text-sm text-[#65736f]">Connector registry for communications, calendar, CRM, and billing surfaces.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {snapshot.audit.sampleRecords.map((record) => (
              <div key={record.id} className="rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="font-semibold text-[#10201d]">{record.label}</p>
                <p className="mt-1 text-sm text-[#65736f]">{record.action}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-[#edf2f0] bg-[#fafcfb] p-4">
            <p className="text-sm font-semibold text-[#10201d]">Registered modules</p>
            <div className="mt-3 grid gap-2">
              {snapshot.platformModules.map((module) => (
                <div key={module.id} className="rounded-md bg-white px-3 py-2 text-sm text-[#5b6662] ring-1 ring-[#edf2f0]">
                  <span className="font-semibold text-[#10201d]">{module.name}</span>
                  <span className="ml-2 text-xs uppercase tracking-[0.18em] text-[#8d9794]">{module.status}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Profile catalog</p>
            <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Installed Flow products</h2>
          </div>
          <div className="rounded-md bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-[#394642]">
            Active profile: {snapshot.activeProfile.name}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.profiles.map((profile) => {
            const validation = snapshot.profileValidations.find((item) => item.id === profile.id);
            const active = profile.id === snapshot.activeProfile.id;

            return (
              <article
                key={profile.id}
                className={`rounded-lg border p-4 ${active ? "border-[#087968] bg-[#f2fbf8]" : "border-[#edf2f0] bg-[#fafcfb]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{profile.industry}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#10201d]">{profile.name}</h3>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(Boolean(validation?.platformReady))}`}>
                    {validation?.platformReady ? "Ready" : "Attention"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5b6662]">{profile.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#65736f]">
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Intents</dt>
                    <dd className="mt-1">{profile.intentCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Workflows</dt>
                    <dd className="mt-1">{profile.workflowCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Templates</dt>
                    <dd className="mt-1">{profile.templateCount}</dd>
                  </div>
                  <div className="rounded-md bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Voice</dt>
                    <dd className="mt-1">{profile.voice}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    </PlatformShell>
  );
}
