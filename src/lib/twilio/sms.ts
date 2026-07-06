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

export function hasConfiguredTwilioSmsSender(env = getBackendEnv()) {
  return Boolean(getTwilioSmsSenderConfiguration(env));
}

function buildSmsEndpoint(connection: TwilioConnection) {
  return `https://api.twilio.com/2010-04-01/Accounts/${connection.account_sid}/Messages.json`;
}

export async function sendConfiguredTwilioSms(input: {
  connection: TwilioConnection;
  body: string;
  to: string | null;
}) {
  const env = getBackendEnv();
  const authToken = decryptConnectionAuthToken(input.connection);
  const sender = getTwilioSmsSenderConfiguration(env);

  if (!input.to) {
    return { error: "Missing destination phone number for SMS.", messageSid: null as string | null, sent: false };
  }

  if (!authToken) {
    return { error: "Missing encrypted Twilio auth token.", messageSid: null as string | null, sent: false };
  }

  if (!sender) {
    return { error: "Missing Twilio SMS sender configuration.", messageSid: null as string | null, sent: false };
  }

  const body = new URLSearchParams();
  body.set("To", input.to);
  body.set("Body", input.body);

  if (sender.type === "messaging_service") {
    body.set("MessagingServiceSid", sender.value);
  } else {
    body.set("From", sender.value);
  }

  const response = await fetch(buildSmsEndpoint(input.connection), {
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
      messageSid: null as string | null,
      sent: false,
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
    sent: true,
  };
}

export async function sendRecoverySms(input: {
  connection: TwilioConnection;
  draft: SmsRecoveryDraft;
}) {
  const result = await sendConfiguredTwilioSms({
    body: input.draft.body,
    connection: input.connection,
    to: input.draft.to,
  });

  return {
    error: result.error,
    messageSid: result.messageSid,
  };
}
