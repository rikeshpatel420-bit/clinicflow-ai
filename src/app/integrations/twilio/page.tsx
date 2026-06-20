import { redirect } from "next/navigation";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getBackendEnv } from "@/lib/backend/env";
import { getTwilioConnectionForClinic, toTwilioConnectionView } from "@/lib/twilio/config";
import { maskAccountSid } from "@/lib/twilio/crypto";
import { getCurrentUser } from "@/lib/supabase/server";
import { deleteTwilioConfigAction, saveTwilioConfigAction, testTwilioConfigAction } from "./actions";

export const dynamic = "force-dynamic";

function statusMessage(value?: string) {
  if (value === "saved") return { tone: "success" as const, text: "Twilio settings saved securely for this clinic." };
  if (value === "deleted") return { tone: "success" as const, text: "Twilio settings removed for this clinic." };
  if (value === "tested") return { tone: "success" as const, text: "Twilio connection verified successfully." };
  if (value === "missing-fields") return { tone: "error" as const, text: "Please complete the Twilio SID, auth token, voice number, and forwarding number." };
  if (value === "not-authorised") return { tone: "error" as const, text: "Only clinic owners and admins can manage Twilio settings." };
  if (value === "no-connection") return { tone: "error" as const, text: "Save Twilio settings before running a connection test." };
  if (value === "test-error") return { tone: "error" as const, text: "Twilio connection test failed. Please check the SID, token, and voice number." };
  if (value === "error") return { tone: "error" as const, text: "Twilio settings could not be saved. Please check the server logs and try again." };
  return null;
}

export default async function TwilioIntegrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  const { siteUrl } = getBackendEnv();

  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const message = statusMessage(params?.status);
  const connectionResult = await getTwilioConnectionForClinic(membership.clinic_id);
  const connection = toTwilioConnectionView(connectionResult.connection);
  const canEdit = membership.role === "owner" || membership.role === "admin";
  const baseUrl = siteUrl.replace(/\/$/, "");
  const voiceWebhookUrl = `${baseUrl}/api/webhooks/twilio/voice`;
  const statusWebhookUrl = `${baseUrl}/api/webhooks/twilio/status`;
  const smsWebhookUrl = `${baseUrl}/api/webhooks/twilio/sms`;

  return (
    <IntegrationShell
      active="/integrations"
      eyebrow="Communications integration"
      title="Twilio call recovery"
      description="Secure clinic-level call capture, missed-call recovery, and SMS workflows for the current practice."
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
      {connectionResult.tableMissing ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Twilio config storage has not been applied to the database yet. The page is ready, but saving will need the new migration.
        </section>
      ) : connectionResult.error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          Twilio settings could not be loaded. {connectionResult.error}
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Connection</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Twilio account setup</h2>
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
                ["Incoming call", voiceWebhookUrl],
                ["Call status", statusWebhookUrl],
                ["Incoming SMS", smsWebhookUrl],
              ].map(([label, url]) => (
                <div key={label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">{label}</p>
                  <p className="mt-1 break-all text-[#65736f]">{url}</p>
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
