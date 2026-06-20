import { redirect } from "next/navigation";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getTwilioSetupHealthForClinic } from "@/lib/twilio/health";
import { maskAccountSid } from "@/lib/twilio/crypto";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteTwilioConfigAction, saveTwilioConfigAction, testTwilioCallRecoveryAction, testTwilioConfigAction, testTwilioSmsAction } from "./actions";

export const dynamic = "force-dynamic";

function statusMessage(value?: string) {
  if (value === "saved") return { tone: "success" as const, text: "Twilio settings saved securely for this clinic." };
  if (value === "deleted") return { tone: "success" as const, text: "Twilio settings removed for this clinic." };
  if (value === "tested") return { tone: "success" as const, text: "Twilio connection verified successfully." };
  if (value === "sms-tested") return { tone: "success" as const, text: "Test SMS sent and logged for this clinic." };
  if (value === "call-tested") return { tone: "success" as const, text: "Test missed-call recovery ran successfully." };
  if (value === "missing-fields") return { tone: "error" as const, text: "Please complete the Twilio SID, auth token, voice number, and forwarding number." };
  if (value === "not-authorised") return { tone: "error" as const, text: "Only clinic owners and admins can manage Twilio settings." };
  if (value === "no-connection") return { tone: "error" as const, text: "Save Twilio settings before running a connection test." };
  if (value === "test-error") return { tone: "error" as const, text: "Twilio connection test failed. Please check the SID, token, and voice number." };
  if (value === "sms-error") return { tone: "error" as const, text: "Test SMS could not be sent. Please check the Twilio sender configuration." };
  if (value === "call-error") return { tone: "error" as const, text: "Test call recovery could not complete. Please review the Twilio setup." };
  if (value === "error") return { tone: "error" as const, text: "Twilio settings could not be saved. Please check the server logs and try again." };
  return null;
}

function pillClass(value: string) {
  if (value === "configured" || value === "ready") return "bg-[#e8f8f4] text-[#087968]";
  return "bg-[#f4f7f6] text-[#65736f]";
}

function statusLabel(value: string) {
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
  const health = await getTwilioSetupHealthForClinic(membership.clinic_id);
  const connection = health.connection;
  const canEdit = membership.role === "owner" || membership.role === "admin";

  return (
    <IntegrationShell
      active="/integrations"
      eyebrow="Communications integration"
      title="Twilio setup wizard"
      description="Secure clinic-level call capture, missed-call recovery, webhook routing, and live SMS validation for the current practice."
    >
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
              {connection?.status ?? "inactive"}
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
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">Twilio URLs</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                { label: "Incoming call", url: health.webhookUrls.voice, state: health.statuses.voiceWebhook },
                { label: "Call status", url: health.webhookUrls.status, state: health.statuses.voiceWebhook },
                { label: "Incoming SMS", url: health.webhookUrls.sms, state: health.statuses.smsWebhook },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{item.label}</p>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${pillClass(String(item.state))}`}>
                      {statusLabel(String(item.state))}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-[#65736f]">{item.url}</p>
                </div>
              ))}
            </div>
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
    </IntegrationShell>
  );
}
