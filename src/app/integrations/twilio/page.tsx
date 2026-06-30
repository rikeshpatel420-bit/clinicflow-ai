import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { CopyValueButton } from "@/components/integrations/copy-value-button";
import { ReadinessAutoRefresh } from "@/components/system/readiness-auto-refresh";
import { TwilioOperationsBoard } from "@/components/integrations/twilio-operations-board";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getBackendEnv } from "@/lib/backend/env";
import { TWILIO_DEMO_NUMBER } from "@/lib/twilio/demo";
import { getTwilioSetupHealthForClinic } from "@/lib/twilio/health";
import { getTwilioProductionSelfTest } from "@/lib/twilio/setup-check";
import { maskAccountSid } from "@/lib/twilio/crypto";
import { getTwilioOperationsDashboardData } from "@/lib/twilio/integration";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  deleteTwilioConfigAction,
  generateTwilioAiSummaryAction,
  saveTwilioConfigAction,
  simulateIncomingCallAction,
  simulateMissedCallAction,
  simulateSmsReplyAction,
  testTwilioCallRecoveryAction,
  testTwilioConfigAction,
  testTwilioSmsAction,
} from "./actions";

export const dynamic = "force-dynamic";

function statusMessage(value?: string) {
  if (value === "saved") return { tone: "success" as const, text: "Twilio settings saved securely for this clinic." };
  if (value === "deleted") return { tone: "success" as const, text: "Twilio settings removed for this clinic." };
  if (value === "tested") return { tone: "success" as const, text: "Twilio connection verified successfully." };
  if (value === "sms-tested") return { tone: "success" as const, text: "Test SMS sent and logged for this clinic." };
  if (value === "call-tested") return { tone: "success" as const, text: "Test missed-call recovery ran successfully." };
  if (value === "incoming-simulated") return { tone: "success" as const, text: "Incoming call simulated and written to Supabase." };
  if (value === "missed-simulated") return { tone: "success" as const, text: "Missed call simulated and recovery thread created." };
  if (value === "reply-simulated") return { tone: "success" as const, text: "SMS reply simulated and the recovery thread updated." };
  if (value === "summary-generated") return { tone: "success" as const, text: "AI summary generated and saved for the latest call." };
  if (value === "missing-fields") return { tone: "error" as const, text: "Please complete the Twilio SID, auth token, voice number, and forwarding number." };
  if (value === "not-authorised") return { tone: "error" as const, text: "Only clinic owners and admins can manage Twilio settings." };
  if (value === "no-connection") return { tone: "error" as const, text: "Save Twilio settings before running a connection test." };
  if (value === "demo-needs-connection") return { tone: "error" as const, text: "Create the Twilio connection first, then try the demo buttons again." };
  if (value === "demo-needs-missed-call") return { tone: "error" as const, text: "Simulate a missed call first so the SMS reply flow has a thread to update." };
  if (value === "demo-needs-call") return { tone: "error" as const, text: "Create a call first, then generate the AI summary." };
  if (value === "storage-missing") return { tone: "error" as const, text: "Twilio configuration storage is missing from the live database. Apply the Twilio migration, then save again." };
  if (value === "test-error") return { tone: "error" as const, text: "Twilio connection test failed. Please check the SID, token, and voice number." };
  if (value === "sms-error") return { tone: "error" as const, text: "Test SMS could not be sent. Please check the Twilio sender configuration." };
  if (value === "call-error") return { tone: "error" as const, text: "Test call recovery could not complete. Please review the Twilio setup." };
  if (value === "demo-error") return { tone: "error" as const, text: "The demo action could not complete. Please check the server logs and try again." };
  if (value === "error") return { tone: "error" as const, text: "Twilio settings could not be saved. Please check the server logs and try again." };
  return null;
}

function pillClass(value: string) {
  if (value === "configured" || value === "ready") return "bg-[#e8f8f4] text-[#087968]";
  if (value === "missing" || value === "not-configured") return "bg-[#fff7f5] text-[#9a3412]";
  return "bg-[#f4f7f6] text-[#65736f]";
}

function statusLabel(value: string) {
  if (value === "configured") return "Configured";
  if (value === "missing") return "Not Configured";
  if (value === "ready") return "Ready";
  return value.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function TwilioIntegrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const message = statusMessage(params?.status);
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto =
    requestHeaders.get("x-forwarded-proto") ?? (forwardedHost && /localhost|127\.0\.0\.1/.test(forwardedHost) ? "http" : "https");
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const health = await getTwilioSetupHealthForClinic(membership.clinic_id, { baseUrl });
  const selfTest = await getTwilioProductionSelfTest({
    baseUrl,
    clinicId: membership.clinic_id,
    role: membership.role,
  });
  const operations = await getTwilioOperationsDashboardData(membership.clinic_id);
  const backendEnv = getBackendEnv();
  const openAiConfigured = Boolean(backendEnv.openaiApiKey);
  const connection = health.connection;
  const canEdit = membership.role === "owner" || membership.role === "admin";

  return (
    <IntegrationShell
      active="/integrations"
      eyebrow="Communications integration"
      title="Twilio setup wizard"
      description="Secure clinic-level call capture, missed-call recovery, webhook routing, and live SMS validation for the current practice."
    >
      <ReadinessAutoRefresh />

      {message ? (
        <section
          className={`rounded-lg border p-4 text-sm font-medium ${
            message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </section>
      ) : null}

      {health.tableMissing ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Twilio config storage has not been applied to the database yet. The wizard is ready, but saving will need the new migration.
        </section>
      ) : health.connectionError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          Twilio settings could not be loaded. {health.connectionError}
        </section>
      ) : null}

      {operations.error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          Twilio activity could not be loaded. {operations.error}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[32px] border border-[#dce6e3] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <p className="text-sm font-semibold text-[#087968]">Live number</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d]">{TWILIO_DEMO_NUMBER}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#65736f]">
            Paste the webhook URLs below into your Twilio Console. The public `/api/twilio/*` routes also remain active for the same flow.
          </p>
          {!openAiConfigured ? (
            <p className="mt-4 rounded-xl border border-[#f8d7c7] bg-[#fff7f2] px-4 py-3 text-sm font-medium text-[#9a3412]">
              OpenAI key not configured
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-[#c8eee6] bg-[#f7fffd] px-4 py-3 text-sm font-medium text-[#087968]">
              OpenAI summary generation is configured.
            </p>
          )}
        </article>

        <article className="rounded-[32px] border border-[#dce6e3] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <p className="text-sm font-semibold text-[#087968]">Configured state</p>
          <div className="mt-4 grid gap-3">
            {[
              { label: "Twilio", value: connection?.status === "active" ? "Configured" : "Not configured" },
              { label: "Voice webhook", value: health.statuses.voiceWebhook === "ready" ? "Configured" : "Not configured" },
              { label: "SMS webhook", value: health.statuses.smsWebhook === "ready" ? "Configured" : "Not configured" },
              { label: "Status callback", value: health.statuses.statusWebhook === "ready" ? "Configured" : "Not configured" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="text-sm font-medium text-[#394642]">{item.label}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.value === "Configured" ? "bg-[#e8f8f4] text-[#087968]" : "bg-[#fff7f2] text-[#9a3412]"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[32px] border border-[#dce6e3] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Production activation</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Self-test the live Twilio setup</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65736f]">
              This check reads the live clinic membership, Twilio connection storage, webhook readiness, and sender configuration without exposing
              secrets.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selfTest.overallReady ? "bg-[#e8f8f4] text-[#087968]" : "bg-[#fff7f2] text-[#9a3412]"}`}>
            {selfTest.overallReady ? "Ready for live traffic" : "Needs attention"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {selfTest.checklist.map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#10201d]">{item.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "complete" ? "bg-[#e8f8f4] text-[#087968]" : item.status === "error" ? "bg-red-50 text-red-700" : "bg-[#fff7f2] text-[#9a3412]"
                  }`}
                >
                  {item.status === "complete" ? "Complete" : item.status === "error" ? "Error" : "Missing"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">{item.detail}</p>
              <p className="mt-3 text-xs font-medium leading-5 text-[#52615d]">{item.action}</p>
            </article>
          ))}
        </div>

        {selfTest.issues.length ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">What to do next</p>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900">
              {selfTest.issues.map((issue) => (
                <li key={issue} className="rounded-xl border border-amber-100 bg-white px-3 py-2">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#c8eee6] bg-[#f7fffd] p-4 text-sm font-medium text-[#087968]">
            Storage is ready, the connection is saved, the number is active, and the webhook URLs are configured.
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        {[
          ["Account SID", health.statuses.accountSid],
          ["Auth token", health.statuses.authToken],
          ["Phone number", health.statuses.phoneNumber],
          ["Voice webhook", health.statuses.voiceWebhook],
          ["SMS webhook", health.statuses.smsWebhook],
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-[#dce6e3] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-lg font-semibold text-[#10201d]">{statusLabel(String(value))}</p>
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${pillClass(String(value))}`}>
                {String(value).replace(/-/g, " ")}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Connection</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Clinic Twilio configuration</h2>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">
                Store the account SID and auth token encrypted at rest, then point Twilio to the clinic-specific webhook URLs below.
              </p>
            </div>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                connection?.status === "active" ? "bg-[#e8f8f4] text-[#087968]" : connection?.status === "error" ? "bg-red-50 text-red-700" : "bg-[#eef4f2] text-[#65736f]"
              }`}
            >
              {connection ? statusLabel(connection.status) : "Not Configured"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Readiness</p>
              <dl className="mt-4 grid gap-3 text-sm">
                {[
                  { label: "Twilio Connected", value: health.indicators.connected },
                  { label: "Phone Number Active", value: health.indicators.phoneNumberActive },
                  { label: "SMS Working", value: health.indicators.smsWorking },
                  { label: "Voice Working", value: health.indicators.voiceWorking },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <dt className="text-[#394642]">{item.label}</dt>
                    <dd className={`font-semibold ${item.value ? "text-[#087968]" : "text-[#65736f]"}`}>
                      {item.value ? "Ready" : "Missing"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Environment checks</p>
              <dl className="mt-4 grid gap-3 text-sm">
                {[
                  { label: "Config secret", value: health.env.configEncryptionSecret },
                  { label: "SMS sender", value: health.env.smsSenderConfigured },
                  { label: "Site URL", value: health.env.siteUrlConfigured },
                  { label: "Webhook test mode", value: health.env.testMode },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <dt className="text-[#394642]">{item.label}</dt>
                    <dd className={`font-semibold ${item.value ? "text-[#087968]" : "text-[#b45309]"}`}>
                      {item.value ? "Configured" : "Missing"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <form action={saveTwilioConfigAction} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Twilio Account SID
                <input
                  name="account_sid"
                  defaultValue={connection?.account_sid ?? ""}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-[#10201d] outline-none focus:border-[#18b7a0] focus:ring-2 focus:ring-[#c6f1e7]"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Auth token
                <input
                  name="auth_token"
                  placeholder={connection?.hasAuthToken ? "Stored securely" : "Enter Twilio auth token"}
                  type="password"
                  className="rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-[#10201d] outline-none focus:border-[#18b7a0] focus:ring-2 focus:ring-[#c6f1e7]"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Twilio voice number
                <input
                  name="voice_number"
                  defaultValue={connection?.voice_number ?? ""}
                  placeholder="+44 20 7946 0820"
                  className="rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-[#10201d] outline-none focus:border-[#18b7a0] focus:ring-2 focus:ring-[#c6f1e7]"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Forward to number
                <input
                  name="forward_to_number"
                  defaultValue={connection?.forward_to_number ?? ""}
                  placeholder="+44 20 7946 0000"
                  className="rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-[#10201d] outline-none focus:border-[#18b7a0] focus:ring-2 focus:ring-[#c6f1e7]"
                  required
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!canEdit}
                className="rounded-md bg-[#087968] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#066657] disabled:cursor-not-allowed disabled:bg-[#9fb8b2]"
              >
                Save Twilio settings
              </button>
              <button
                formAction={testTwilioConfigAction}
                type="submit"
                disabled={!canEdit || !connection}
                className="rounded-md border border-[#cdd8d5] bg-white px-5 py-3 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Test connection
              </button>
              <button
                formAction={testTwilioSmsAction}
                type="submit"
                disabled={!canEdit || !connection}
                className="rounded-md border border-[#cdd8d5] bg-white px-5 py-3 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Test SMS
              </button>
              <button
                formAction={testTwilioCallRecoveryAction}
                type="submit"
                disabled={!canEdit || !connection}
                className="rounded-md border border-[#cdd8d5] bg-white px-5 py-3 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Test call recovery
              </button>
            </div>
            {!canEdit ? <p className="text-sm text-[#65736f]">Only owners and admins can edit Twilio configuration.</p> : null}
          </form>

          <form action={deleteTwilioConfigAction} className="mt-3">
            <button
              type="submit"
              disabled={!canEdit || !connection}
              className="rounded-md border border-[#cdd8d5] bg-white px-5 py-3 text-sm font-semibold text-[#394642] hover:border-[#9db2ad] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Disconnect
            </button>
          </form>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">Webhooks</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">Paste these into Twilio</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                { label: "Voice webhook", url: health.webhookUrls.voice, state: health.statuses.voiceWebhook },
                { label: "SMS webhook", url: health.webhookUrls.sms, state: health.statuses.smsWebhook },
                { label: "Status callback", url: health.webhookUrls.status, state: health.statuses.statusWebhook },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{item.label}</p>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${pillClass(String(item.state))}`}>
                      {statusLabel(String(item.state))}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-[#65736f]">{item.url}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <CopyValueButton value={item.url} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-[#65736f]">
              The legacy aliases `/api/twilio/voice`, `/api/twilio/sms`, and `/api/twilio/status` remain active if you already pasted them somewhere.
            </p>
          </article>

          <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">Demo mode</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">Create live demo activity</h2>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">
              These buttons write real clinic-scoped rows so the dashboard, calls, patients, inbox, and AI summary views all move together.
            </p>
            <div className="mt-4 grid gap-2">
              <form action={simulateIncomingCallAction}>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="w-full rounded-md bg-[#10201d] px-4 py-3 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d1816] disabled:cursor-not-allowed disabled:bg-[#96a8a2]"
                >
                  Simulate incoming call
                </button>
              </form>
              <form action={simulateMissedCallAction}>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="w-full rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-left text-sm font-semibold text-[#10201d] shadow-sm transition hover:border-[#9db2ad] hover:bg-[#f7faf9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Simulate missed call
                </button>
              </form>
              <form action={simulateSmsReplyAction}>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="w-full rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-left text-sm font-semibold text-[#10201d] shadow-sm transition hover:border-[#9db2ad] hover:bg-[#f7faf9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Simulate SMS reply
                </button>
              </form>
              <form action={generateTwilioAiSummaryAction}>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="w-full rounded-md border border-[#cdd8d5] bg-white px-4 py-3 text-left text-sm font-semibold text-[#10201d] shadow-sm transition hover:border-[#9db2ad] hover:bg-[#f7faf9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Generate AI summary
                </button>
              </form>
            </div>
            {!canEdit ? <p className="mt-3 text-sm text-[#65736f]">Only owners and admins can run the demo buttons.</p> : null}
          </article>

          <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">Current state</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">Stored connection</h2>
            {connection ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">Account SID</p>
                  <p className="mt-1 text-[#65736f]">{maskAccountSid(connection.account_sid)}</p>
                </div>
                <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">Voice number</p>
                  <p className="mt-1 text-[#65736f]">{connection.voice_number}</p>
                </div>
                <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">Forward to</p>
                  <p className="mt-1 text-[#65736f]">{connection.forward_to_number}</p>
                </div>
                {connection.last_error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <p className="font-semibold">Last error</p>
                    <p className="mt-1 text-sm">{connection.last_error}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#65736f]">
                No Twilio connection is stored for this clinic yet. Save the details on the left to activate call capture and recovery.
              </p>
            )}
          </article>
        </div>
      </section>

      <TwilioOperationsBoard data={operations} />
    </IntegrationShell>
  );
}
