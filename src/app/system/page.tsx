import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CopyValueButton } from "@/components/integrations/copy-value-button";
import { SiteHeader } from "@/components/navigation/site-header";
import { ReadinessAutoRefresh } from "@/components/system/readiness-auto-refresh";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildProductionReadinessReport } from "@/lib/system/readiness";

export const dynamic = "force-dynamic";

function statusChipClass(status: "complete" | "missing" | "error") {
  if (status === "complete") return "border-[#c8eee6] bg-[#f7fffd] text-[#087968]";
  if (status === "missing") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-700";
}

function statusSymbol(status: "complete" | "missing" | "error") {
  if (status === "complete") return "\u2714 Complete";
  if (status === "missing") return "\u26A0 Missing";
  return "\u274C Error";
}

export default async function SystemPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto =
    requestHeaders.get("x-forwarded-proto") ?? (forwardedHost && /localhost|127\.0\.0\.1/.test(forwardedHost) ? "http" : "https");
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const report = await buildProductionReadinessReport({ baseUrl, user });

  const completeSteps = report.steps.filter((step) => step.status === "complete").length;
  const missingSteps = report.steps.filter((step) => step.status === "missing").length;
  const errorSteps = report.steps.filter((step) => step.status === "error").length;

  const envCards = [
    { label: "NEXT_PUBLIC_SITE_URL", configured: report.env.siteUrl, note: "Production app URL used by health checks and webhook URLs." },
    { label: "NEXT_PUBLIC_SUPABASE_URL", configured: report.env.supabaseUrl, note: "Required for login and browser-side session handling." },
    { label: "NEXT_PUBLIC_SUPABASE_ANON_KEY", configured: report.env.supabaseAnonKey, note: "Required for authenticated server/client requests." },
    { label: "SUPABASE_SERVICE_ROLE_KEY", configured: report.env.supabaseServiceRoleKey, note: "Required to inspect and write clinic-scoped operational data." },
    { label: "TWILIO_CONFIG_ENCRYPTION_SECRET", configured: report.env.twilioConfigEncryptionSecret, note: "Required to encrypt and decrypt the clinic auth token." },
    { label: "TWILIO_AUTH_TOKEN", configured: report.env.twilioAuthToken, note: "Optional fallback only; the clinic-row token is preferred for production webhooks." },
    { label: "TWILIO_WEBHOOK_TEST_MODE", configured: !report.env.twilioTestMode, note: "Must be false for live Twilio signature checks." },
    { label: "OPENAI_API_KEY", configured: report.env.openAiKey, note: "Required for call summaries and recommendations." },
    { label: "SMS sender", configured: report.env.twilioMessagingServiceSid || report.env.twilioPhoneNumber, note: "Use either a Messaging Service SID or the Twilio number itself." },
  ];

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/system" variant="app" />
      <ReadinessAutoRefresh />

      <section className="mx-auto grid max-w-[88rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-[#dce6e3] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#087968]">
              Production readiness
            </p>
            <p className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1 text-xs font-semibold text-[#52615d]">
              Live refresh every 15s
            </p>
            <p className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1 text-xs font-semibold text-[#52615d]">
              Mode: {report.deploymentMode}
            </p>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#10201d] sm:text-5xl">Production setup wizard</h1>
              <p className="mt-4 max-w-3xl text-[1.02rem] leading-7 text-[#5d6d68]">
                This audit checks the live ClinicFlow dependencies a real clinic needs before calls can be answered, routed, recovered,
                and summarised safely.
              </p>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-[#edf2f0] bg-white p-4">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="text-sm font-medium text-[#52615d]">Complete</span>
                <span className="text-lg font-semibold text-[#087968]">{completeSteps}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="text-sm font-medium text-[#52615d]">Missing</span>
                <span className="text-lg font-semibold text-amber-700">{missingSteps}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="text-sm font-medium text-[#52615d]">Errors</span>
                <span className="text-lg font-semibold text-red-700">{errorSteps}</span>
              </div>
            </div>
          </div>
        </header>

        {!report.env.siteUrl || report.urls.health.includes("localhost") ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-900">
            Production URL still needs to point at <span className="font-semibold">https://www.clinicflowhq.co.uk</span> via{" "}
            <span className="font-semibold">NEXT_PUBLIC_SITE_URL</span>.
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {report.steps.map((step) => (
            <article
              key={step.label}
              className="rounded-[28px] border border-[#dce6e3] bg-white p-5 shadow-[0_18px_60px_rgba(16,33,29,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#087968]">{step.label}</p>
                  <h2 className="mt-2 text-xl font-semibold text-[#10201d]">{statusSymbol(step.status)}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusChipClass(step.status)}`}>{step.value}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5d6d68]">{step.detail}</p>
              {step.actionHref && step.actionLabel ? (
                <Link
                  href={step.actionHref}
                  className="mt-4 inline-flex rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] transition hover:bg-[#066657]"
                >
                  {step.actionLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
            <p className="text-sm font-semibold text-[#087968]">Environment checks</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Required secrets and runtime switches</h2>
            <div className="mt-5 grid gap-3">
              {envCards.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#10201d]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[#5d6d68]">{item.note}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.configured ? "border border-[#c8eee6] bg-[#f7fffd] text-[#087968]" : "border border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {item.configured ? "Configured" : "Missing"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
            <p className="text-sm font-semibold text-[#087968]">Twilio endpoints</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Exact URLs to paste into Twilio</h2>
            <p className="mt-2 text-sm leading-6 text-[#5d6d68]">
              These are the production endpoints the phone number should use. The public `/api/twilio/*` aliases remain available.
            </p>

            <div className="mt-5 grid gap-3">
              {[
                { label: "Voice webhook", url: report.urls.voice, status: report.twilio.publicHealth.statuses.voiceWebhook },
                { label: "SMS webhook", url: report.urls.sms, status: report.twilio.publicHealth.statuses.smsWebhook },
                { label: "Status callback", url: report.urls.status, status: report.twilio.publicHealth.statuses.statusWebhook },
                { label: "Health check", url: report.urls.health, status: report.twilio.publicHealth.connected ? "ready" : "missing" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{item.label}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "ready" ? "border border-[#c8eee6] bg-[#f7fffd] text-[#087968]" : "border border-amber-200 bg-amber-50 text-amber-800"}`}>
                      {item.status === "ready" ? "Configured" : "Missing"}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-sm leading-6 text-[#5d6d68]">{item.url}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyValueButton value={item.url} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
            <p className="text-sm font-semibold text-[#087968]">Database audit</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Tables that must exist in the live schema</h2>
            <div className="mt-5 grid gap-3">
              {report.tables.map((item) => (
                <div key={item.detail} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#10201d]">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[#5d6d68]">{item.detail}</p>
                      {item.note ? <p className="mt-1 text-xs leading-5 text-[#7b8a85]">{item.note}</p> : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "complete"
                          ? "border border-[#c8eee6] bg-[#f7fffd] text-[#087968]"
                          : item.status === "missing"
                            ? "border border-amber-200 bg-amber-50 text-amber-800"
                            : "border border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
            <p className="text-sm font-semibold text-[#087968]">Routes and blockers</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">What still prevents go-live</h2>

            <div className="mt-5 grid gap-3">
              {report.routes.map((route) => (
                <div key={route.href} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={route.href} className="font-semibold text-[#10201d] hover:text-[#087968]">
                      {route.label}
                    </Link>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusChipClass(route.status)}`}>{statusSymbol(route.status)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5d6d68]">{route.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="text-sm font-semibold text-[#10201d]">Remaining blockers</p>
              {report.blockers.length > 0 ? (
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#5d6d68]">
                  {report.blockers.map((blocker) => (
                    <li key={blocker} className="rounded-xl border border-[#edf2f0] bg-white px-3 py-2">
                      {blocker}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-[#c8eee6] bg-[#f7fffd] px-3 py-2 text-sm font-medium text-[#087968]">
                  No blockers remain. ClinicFlow is ready for live Twilio traffic.
                </p>
              )}
            </div>
          </article>
        </section>

        <footer className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Last checked</p>
              <p className="mt-1 text-sm text-[#5d6d68]">{new Date(report.lastCheckedAt).toLocaleString("en-GB")}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/integrations/twilio" className="rounded-full border border-[#dbe6e2] bg-white px-4 py-2.5 text-[#10201d] hover:border-[#c8eee6] hover:bg-[#f7fffd]">
                Open Twilio setup
              </Link>
              <Link href="/dashboard" className="rounded-full bg-[#087968] px-4 py-2.5 text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
                Open dashboard
              </Link>
            </div>
          </div>

          <p className="mt-4 text-xs leading-6 text-[#7b8a85]">
            ClinicFlow stores the Twilio auth token encrypted per clinic and prefers the clinic-row token for webhook validation. The app tracks the
            phone number itself in `twilio_connections`; a Twilio phone number SID is not part of the current schema, so it is treated as a
            console-side value rather than a stored app dependency.
          </p>
        </footer>
      </section>
    </main>
  );
}
