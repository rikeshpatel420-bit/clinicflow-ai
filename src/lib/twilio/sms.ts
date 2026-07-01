import { getBackendEnv } from "@/lib/backend/env";
import { getActiveFlowPlatformProfile } from "@/lib/flow-platform";
import type { TwilioConnection } from "@/types/database";
import { decryptConnectionAuthToken } from "./config";
import { getTwilioSmsSenderConfiguration } from "./health";

export type SmsRecoveryDraft = {
  body: string;
  to: string | null;
};

export function createRecoverySmsDraft(input: { clinicName?: string | null; patientPhone?: string | null }) {
  const clinicName = input.clinicName?.trim() || "the clinic";
  const activeFlowPlatformProfile = getActiveFlowPlatformProfile();
  return {
    body: activeFlowPlatformProfile.conversation.leads.templates.sms.missedCallRecovery.replace("ClinicFlow Dental", clinicName),
    to: input.patientPhone ?? null,
  } satisfies SmsRecoveryDraft;
}

function buildSmsEndpoint(connection: TwilioConnection) {
  return getTwilioSmsSenderConfiguration(getBackendEnv())
    ? `https://api.twilio.com/2010-04-01/Accounts/${connection.account_sid}/Messages.json`
    : null;
}

export async function sendRecoverySms(input: {
  connection: TwilioConnection;
  draft: SmsRecoveryDraft;
}) {
  const env = getBackendEnv();
  const authToken = decryptConnectionAuthToken(input.connection);

  if (!input.draft.to) {
    return { error: "Missing patient phone number for recovery SMS." };
  }

  if (!authToken) {
    return { error: "Missing encrypted Twilio auth token." };
  }

  const endpoint = buildSmsEndpoint(input.connection);
  if (!endpoint) {
    return {
      error: "Missing Twilio message sender configuration.",
    };
  }

  const body = new URLSearchParams();
  body.set("To", input.draft.to);
  body.set("Body", input.draft.body);

  const sender = getTwilioSmsSenderConfiguration(env);
  if (sender?.type === "messaging_service") {
    body.set("MessagingServiceSid", sender.value);
  } else if (sender?.type === "phone_number") {
    body.set("From", sender.value);
  }

  const response = await fetch(endpoint, {
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(`${input.connection.account_sid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      error: text || `Twilio SMS request failed with status ${response.status}.`,
    };
  }

  let parsed: { sid?: string } | null = null;
  try {
    parsed = JSON.parse(text) as { sid?: string };
  } catch {
    parsed = null;
  }

  return {
    error: null,
    messageSid: parsed?.sid ?? null,
  };
}
