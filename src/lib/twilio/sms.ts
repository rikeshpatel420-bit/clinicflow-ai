import { getBackendEnv } from "@/lib/backend/env";
import type { TwilioConnection } from "@/types/database";
import { decryptConnectionAuthToken } from "./config";

export type SmsRecoveryDraft = {
  body: string;
  to: string | null;
};

export function createRecoverySmsDraft(input: { clinicName?: string | null; patientPhone?: string | null }) {
  const clinicName = input.clinicName?.trim() || "the clinic";
  return {
    body: `Hi, thanks for calling ${clinicName}. Sorry we missed you. Reply YES and we’ll call you back.`,
    to: input.patientPhone ?? null,
  } satisfies SmsRecoveryDraft;
}

function buildSmsEndpoint(connection: TwilioConnection) {
  const env = getBackendEnv();

  if (env.twilioMessagingServiceSid) {
    return `https://api.twilio.com/2010-04-01/Accounts/${connection.account_sid}/Messages.json`;
  }

  if (env.twilioPhoneNumber) {
    return `https://api.twilio.com/2010-04-01/Accounts/${connection.account_sid}/Messages.json`;
  }

  return null;
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

  if (env.twilioMessagingServiceSid) {
    body.set("MessagingServiceSid", env.twilioMessagingServiceSid);
  } else if (env.twilioPhoneNumber) {
    body.set("From", env.twilioPhoneNumber);
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
