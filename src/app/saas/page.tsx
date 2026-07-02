import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SaasShell } from "@/components/saas/saas-shell";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildCommercialSaasSnapshot } from "@/lib/saas";

export const dynamic = "force-dynamic";

function badgeClass(value: "complete" | "missing" | "error" | "ready" | "available" | "attention" | "active" | "planned") {
  switch (value) {
    case "complete":
    case "ready":
    case "active":
      return "bg-[#e9faf5] text-[#087968]";
    case "available":
      return "bg-[#f7faf9] text-[#5a6763]";
    case "attention":
    case "missing":
      return "bg-amber-50 text-amber-700";
    case "error":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-[#f7faf9] text-[#5a6763]";
  }
}

function completionClass(complete: boolean) {
  return complete ? "bg-[#e9faf5] text-[#087968]" : "bg-amber-50 text-amber-700";
}

export default async function SaasPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? (forwardedHost && /localhost|127\.0\.0\.1/.test(forwardedHost) ? "http" : "https");
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const snapshot = await buildCommercialSaasSnapshot({ baseUrl, user });

  const activeProducts = snapshot.marketplace.filter((product) => product.active);
  const readyProducts = snapshot.marketplace.filter((product) => product.activationState !== "attention");
  const commercialScore = Math.round((snapshot.readiness.readinessScore + snapshot.onboarding.healthScore + (snapshot.integrations.counts.connected / snapshot.integrations.providerCount) * 100 + (snapshot.billing.configured ? 100 : 40)) / 4);

  return (
    <SaasShell
      active="/saas"
      eyebrow="Commercial SaaS foundation"
      title="The operating system for every Flow business"
      description="Tenant isolation, billing, activation, onboarding, AI customisation, and integration readiness all live in one reusable control plane."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Commercial readiness", value: `${commercialScore}%`, note: snapshot.readiness.goLiveReady ? "Ready for go-live" : `${snapshot.readiness.blockers.length} blockers` },
          { label: "Onboarding health", value: `${snapshot.onboarding.healthScore}%`, note: snapshot.onboarding.ready ? "Business setup complete" : "Wizard-driven setup" },
          { label: "Activated products", value: activeProducts.length, note: `${readyProducts.length} ready to activate` },
          { label: "Connected integrations", value: snapshot.integrations.counts.connected, note: `${snapshot.integrations.providerCount} connectors registered` },
          { label: "Audit samples", value: snapshot.audit.sampleRecords.length, note: "Reusable audit trail" },
        ].map((card) => (
          <article key={card.label} className="rounded-[22px] border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Tenant model</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Organisation, workspace, branch, and role</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6662]">
                We keep the live app clinic-scoped, then layer commercial concepts on top so each business sees a single active workspace with reusable access
                control and audit boundaries.
              </p>
            </div>
            <div className="rounded-full border border-[#dce6e3] bg-[#f7faf9] px-3 py-1 text-xs font-semibold text-[#394642]">
              {snapshot.workspaceSummary.organisationLabel}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Organisation", value: snapshot.workspaceSummary.organisationLabel },
              { label: "Workspace", value: snapshot.tenant.workspaceName },
              { label: "Active clinic", value: snapshot.tenant.activeClinicId ?? "Demo clinic" },
              { label: "Role", value: snapshot.tenant.role ?? "member" },
              { label: "Branches", value: String(snapshot.workspaceSummary.branchCount) },
              { label: "Workspaces", value: String(snapshot.workspaceSummary.workspaceCount) },
              { label: "Permissions", value: String(snapshot.workspaceSummary.permissionCount) },
              { label: "Feature flags", value: String(snapshot.workspaceSummary.featureFlagCount) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-[#10201d]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-[#10201d]">Active role permissions</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">
                {snapshot.tenant.permissions.length} permissions
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {snapshot.tenant.permissions.map((permission) => (
                <span key={permission} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#5b6662] ring-1 ring-[#edf2f0]">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Billing foundation</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Stripe-ready commercial model</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5b6662]">
                Plans, trials, seats, usage limits, invoices, and entitlements are separated from the UI so a real billing provider can be wired in later
                without changing product behaviour.
              </p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${completionClass(snapshot.billing.configured)}`}>
              {snapshot.billing.configured ? "Configured" : "Pending"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Current plan</p>
              <p className="mt-2 text-sm font-semibold text-[#10201d]">{snapshot.billing.planName}</p>
              <p className="mt-1 text-sm text-[#65736f]">Status: {snapshot.billing.subscriptionStatus}</p>
            </div>
            <div className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Subscriptions</p>
              <p className="mt-2 text-sm font-semibold text-[#10201d]">{snapshot.billing.plans.length} plan tiers</p>
              <p className="mt-1 text-sm text-[#65736f]">Usage limits stay profile-aware and seat-driven.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {snapshot.billing.plans.map((plan) => (
              <div key={plan.key} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10201d]">{plan.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#65736f]">{plan.priceEnvKey}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${completionClass(plan.priceConfigured)}`}>
                    {plan.priceConfigured ? "Configured" : "Missing"}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-white px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Clinics</dt>
                    <dd className="mt-1 font-semibold text-[#10201d]">{plan.clinicsIncluded}</dd>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2">
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Seats</dt>
                    <dd className="mt-1 font-semibold text-[#10201d]">{plan.usageLimit.seats}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Product marketplace</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Activate any Flow product from configuration</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6662]">
                The platform catalog shows what is installed, what is ready, and what is currently active. Every product inherits the same engine and only
                swaps profile configuration.
              </p>
            </div>
            <Link href="/platform/profiles" className="rounded-full bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f2b]">
              Compare profiles
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.marketplace.map((product) => (
              <article key={product.id} className={`rounded-[24px] border p-5 ${product.active ? "border-[#087968] bg-[#f2fbf8]" : "border-[#edf2f0] bg-[#fafcfb]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{product.industry}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#10201d]">{product.name}</h3>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(product.activationState)}`}>{product.activationState}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5b6662]">{product.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#65736f]">
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Workflows</dt>
                    <dd className="mt-1">{product.workflowCount}</dd>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Templates</dt>
                    <dd className="mt-1">{product.templateCount}</dd>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Intents</dt>
                    <dd className="mt-1">{product.intentCount}</dd>
                  </div>
                  <div className="rounded-xl bg-white px-2 py-2">
                    <dt className="font-semibold text-[#10201d]">Voice</dt>
                    <dd className="mt-1">{product.voice}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.dashboardCards.map((card) => (
                    <span key={card} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#5b6662] ring-1 ring-[#edf2f0]">
                      {card}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="grid gap-6">
          <section className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#087968]">First-customer readiness</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Can this business go live?</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completionClass(snapshot.readiness.goLiveReady)}`}>
                {snapshot.readiness.goLiveReady ? "Platform Ready" : "Needs attention"}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {snapshot.readiness.steps.map((step) => (
                <div key={step.label} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{step.label}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(step.status)}`}>{step.value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#65736f]">{step.detail}</p>
                </div>
              ))}
            </div>
            {snapshot.readiness.blockers.length > 0 ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Blockers: {snapshot.readiness.blockers.join(" / ")}
              </p>
            ) : (
              <p className="mt-4 rounded-2xl border border-[#d9f3eb] bg-[#f4fbf8] px-4 py-3 text-sm text-[#087968]">
                No blockers. The stack is ready to support a first customer launch.
              </p>
            )}
          </section>

          <section className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">Onboarding completion</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Wizard-driven setup without engineering</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Generated profile</p>
                <p className="mt-2 text-sm font-semibold text-[#10201d]">{snapshot.onboarding.generatedProfileId}</p>
              </div>
              <div className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Health score</p>
                <p className="mt-2 text-sm font-semibold text-[#10201d]">{snapshot.onboarding.healthScore}%</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {snapshot.onboarding.sections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                  <p className="font-semibold text-[#10201d]">{section.title}</p>
                  <p className="mt-1 text-sm text-[#65736f]">{section.description}</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#5b6662]">
                    {section.items.slice(0, 4).map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-[#edf2f0]">
                        <span className="font-medium text-[#10201d]">{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/onboarding" className="rounded-full bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f2b]">
                Open onboarding
              </Link>
              <Link href="/factory" className="rounded-full border border-[#dce6e3] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] hover:bg-[#f7faf9]">
                Generate a new product
              </Link>
            </div>
          </section>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">AI studio</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Prompt, tone, and receptionist wording</h2>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Greeting", value: snapshot.aiStudio.greeting },
              { label: "Tone", value: snapshot.aiStudio.tone },
              { label: "Closing", value: snapshot.aiStudio.closing },
              { label: "After-hours wording", value: snapshot.aiStudio.afterHours },
              { label: "Human transfer", value: snapshot.aiStudio.humanTransfer },
              { label: "Emergency wording", value: snapshot.aiStudio.emergency },
              { label: "FAQ behaviour", value: snapshot.aiStudio.faqBehaviour },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-[#10201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Integration readiness</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Connectors and automation interfaces</h2>
          <p className="mt-2 text-sm leading-6 text-[#5b6662]">
            The platform can expose connectors for Google Calendar, Microsoft 365, Twilio, OpenAI, Stripe, WhatsApp, email, webhooks, Zapier, Make, and n8n
            without baking product-specific logic into the core.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {snapshot.integrations.providers.map((provider) => (
              <div key={provider.key} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10201d]">{provider.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#65736f]">{provider.category.replace("_", " ")}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(provider.readiness)}`}>{provider.readiness}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#65736f]">{provider.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Connected", value: snapshot.integrations.counts.connected },
              { label: "Available", value: snapshot.integrations.counts.available },
              { label: "Planned", value: snapshot.integrations.counts.planned },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#10201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Security and GDPR</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Safe by default for multi-tenant operations</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.security.secretChecks.map((secret) => (
              <div key={secret.key} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#10201d]">{secret.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#65736f]">{secret.key} / {secret.scope}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${completionClass(secret.configured)}`}>
                    {secret.configured ? "Configured" : "Missing"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#65736f]">{secret.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Audit trail</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Commercial events and product inheritance</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.audit.sampleRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-[#edf2f0] bg-[#fafcfb] p-4">
                <p className="font-semibold text-[#10201d]">{record.label}</p>
                <p className="mt-1 text-sm text-[#65736f]">{record.action}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/platform/foundation" className="rounded-full bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f2b]">
              View shared foundation
            </Link>
            <Link href="/system" className="rounded-full border border-[#dce6e3] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] hover:bg-[#f7faf9]">
              Check readiness
            </Link>
          </div>
        </article>
      </section>
    </SaasShell>
  );
}
