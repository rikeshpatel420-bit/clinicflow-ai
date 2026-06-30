import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TWILIO_DEMO_NUMBER } from "./demo";
import { getTwilioSetupHealthForClinic } from "./health";
import { normalizePhoneNumber } from "./crypto";

export type TwilioSetupChecklistStatus = "complete" | "missing" | "error";

export type TwilioSetupChecklistItem = {
  action: string;
  detail: string;
  label: string;
  status: TwilioSetupChecklistStatus;
};

export type TwilioSetupSelfTest = {
  activeClinicExists: boolean;
  activeClinicName: string | null;
  checklist: TwilioSetupChecklistItem[];
  connectionSaved: boolean;
  credentialsValid: boolean;
  issues: string[];
  ownerMembershipExists: boolean;
  overallReady: boolean;
  smsSenderReady: boolean;
  storageReady: boolean;
  voiceNumberActive: boolean;
  webhookUrlsReady: boolean;
};

function checklistStatusToIssue(status: TwilioSetupChecklistStatus) {
  return status === "complete" ? null : status === "error" ? "Error" : "Missing";
}

function normalizeReadyPhone(value?: string | null) {
  return normalizePhoneNumber(value);
}

export async function getTwilioProductionSelfTest(input: {
  baseUrl?: string | null;
  clinicId: string;
  role?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .select("id,name,status")
    .eq("id", input.clinicId)
    .maybeSingle<{ id: string; name: string; status: string }>();

  const health = await getTwilioSetupHealthForClinic(input.clinicId, { baseUrl: input.baseUrl });
  const activeClinicExists = Boolean(clinic && clinic.status === "active");
  const ownerMembershipExists = input.role === "owner" || input.role === "admin";
  const storageReady = !health.tableMissing;
  const connectionSaved = Boolean(health.connection);
  const credentialsValid = Boolean(health.connection && health.connection.active && health.connection.hasAuthToken && !health.connectionError);
  const voiceNumberActive = normalizeReadyPhone(health.connection?.voice_number) === normalizeReadyPhone(TWILIO_DEMO_NUMBER);
  const smsSenderReady = health.env.smsSenderConfigured;
  const webhookUrlsReady =
    !health.env.testMode &&
    health.statuses.voiceWebhook === "ready" &&
    health.statuses.smsWebhook === "ready" &&
    health.statuses.statusWebhook === "ready";

  const checklist: TwilioSetupChecklistItem[] = [
    {
      action: activeClinicExists ? "Clinic is active." : "Activate or recreate the clinic workspace in onboarding.",
      detail: activeClinicExists ? `Clinic ${clinic?.name ?? input.clinicId} is active.` : "No active clinic row is available for this user.",
      label: "Active clinic exists",
      status: activeClinicExists ? "complete" : clinicError ? "error" : "missing",
    },
    {
      action: ownerMembershipExists
        ? "Membership is ready."
        : "Ensure the signed-in user has an active owner/admin row in public.clinic_users for this clinic.",
      detail: ownerMembershipExists
        ? "The current user has the expected owner/admin access."
        : "The current user is not an active owner or admin for this clinic.",
      label: "Owner membership exists",
      status: ownerMembershipExists ? "complete" : "missing",
    },
    {
      action: storageReady
        ? "Storage is ready."
        : "Apply supabase/migrations/0009_repair_twilio_connections_table.sql in production Supabase, then redeploy.",
      detail: storageReady
        ? "The twilio_connections table is available in the live schema."
        : "The twilio_connections table is missing from production.",
      label: "Storage ready",
      status: storageReady ? "complete" : "error",
    },
    {
      action: connectionSaved
        ? "Connection is saved."
        : "Save the clinic Account SID, auth token, voice number, and forwarding number in /integrations/twilio.",
      detail: connectionSaved
        ? "An active Twilio connection row exists for this clinic."
        : "No Twilio connection row is saved for the active clinic yet.",
      label: "Connection saved",
      status: connectionSaved ? "complete" : "missing",
    },
    {
      action: credentialsValid
        ? "Twilio credentials are valid."
        : connectionSaved
          ? "Re-enter the Twilio auth token so the connection can be decrypted and validated."
          : "Save the Twilio configuration first, then test the credentials.",
      detail: credentialsValid
        ? "The encrypted auth token decrypts correctly and the connection is marked active."
        : "The connection token cannot be decrypted or the row is inactive.",
      label: "Twilio credentials valid",
      status: credentialsValid ? "complete" : connectionSaved ? "error" : "missing",
    },
    {
      action: voiceNumberActive
        ? "Voice number is active."
        : `Set the Twilio voice number to ${TWILIO_DEMO_NUMBER}.`,
      detail: voiceNumberActive
        ? `The clinic connection is using ${TWILIO_DEMO_NUMBER}.`
        : `The clinic connection voice number must match ${TWILIO_DEMO_NUMBER}.`,
      label: "Voice number active",
      status: voiceNumberActive ? "complete" : connectionSaved ? "error" : "missing",
    },
    {
      action: smsSenderReady
        ? "SMS sender is ready."
        : "Set TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID in Vercel Production and redeploy.",
      detail: smsSenderReady
        ? "The app can resolve an outbound SMS sender from the environment."
        : "No Twilio SMS sender is configured in the environment.",
      label: "SMS sender ready",
      status: smsSenderReady ? "complete" : "missing",
    },
    {
      action: webhookUrlsReady
        ? "Webhook URLs are ready."
        : "Paste the production voice, SMS, and status callback URLs into the Twilio Console and disable webhook test mode.",
      detail: webhookUrlsReady
        ? "Voice, SMS, and status callback URLs are resolving on the production origin."
        : "One or more production webhook URLs are not yet ready.",
      label: "Webhook URLs ready",
      status: webhookUrlsReady ? "complete" : "missing",
    },
  ];

  const issues = checklist
    .filter((item) => item.status !== "complete")
    .map((item) => `${item.label}: ${checklistStatusToIssue(item.status) ?? "Missing"}. ${item.action}`);

  return {
    activeClinicExists,
    activeClinicName: clinic?.name ?? null,
    checklist,
    connectionSaved,
    credentialsValid,
    issues,
    ownerMembershipExists,
    overallReady: checklist.every((item) => item.status === "complete"),
    smsSenderReady,
    storageReady,
    voiceNumberActive,
    webhookUrlsReady,
  } satisfies TwilioSetupSelfTest;
}
