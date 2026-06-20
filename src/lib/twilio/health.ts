import { getBackendEnv } from "@/lib/backend/env";
import { getTwilioConnectionForClinic, toTwilioConnectionView, type TwilioConnectionView } from "./config";

export type TwilioEndpointStatus = "ready" | "missing-site-url" | "missing-connection" | "missing-config";

export type TwilioSetupHealth = {
  connection: TwilioConnectionView | null;
  connectionError: string | null;
  env: {
    configEncryptionSecret: boolean;
    smsSenderConfigured: boolean;
    siteUrlConfigured: boolean;
    testMode: boolean;
  };
  indicators: {
    connected: boolean;
    phoneNumberActive: boolean;
    smsWorking: boolean;
    voiceWorking: boolean;
  };
  statuses: {
    accountSid: "configured" | "missing";
    authToken: "configured" | "missing";
    phoneNumber: "configured" | "missing";
    voiceWebhook: TwilioEndpointStatus;
    smsWebhook: TwilioEndpointStatus;
  };
  tableMissing: boolean;
  webhookUrls: {
    sms: string;
    status: string;
    voice: string;
  };
};

function baseUrl() {
  return getBackendEnv().siteUrl.replace(/\/$/, "");
}

function buildWebhookUrls() {
  const origin = baseUrl();
  return {
    sms: `${origin}/api/webhooks/twilio/sms`,
    status: `${origin}/api/webhooks/twilio/status`,
    voice: `${origin}/api/webhooks/twilio/voice`,
  };
}

function endpointStatus(input: { connectionConfigured: boolean; siteUrlConfigured: boolean }): TwilioEndpointStatus {
  if (!input.siteUrlConfigured) return "missing-site-url";
  if (!input.connectionConfigured) return "missing-connection";
  return "ready";
}

export function getTwilioEnvHealth() {
  const env = getBackendEnv();

  return {
    configEncryptionSecret: Boolean(env.twilioConfigEncryptionSecret),
    smsSenderConfigured: Boolean(env.twilioMessagingServiceSid || env.twilioPhoneNumber),
    siteUrlConfigured: Boolean(env.siteUrl),
    testMode: Boolean(env.twilioWebhookTestMode),
  };
}

export async function getTwilioSetupHealthForClinic(clinicId: string): Promise<TwilioSetupHealth> {
  const env = getTwilioEnvHealth();
  const connectionResult = await getTwilioConnectionForClinic(clinicId);
  const connection = toTwilioConnectionView(connectionResult.connection);
  const indicators = {
    connected: Boolean(
      connection &&
        connection.status === "active" &&
        connection.account_sid &&
        connection.hasAuthToken &&
        connection.voice_number &&
        env.configEncryptionSecret,
    ),
    phoneNumberActive: Boolean(connection?.voice_number),
    smsWorking: Boolean(connection && connection.status === "active" && env.smsSenderConfigured),
    voiceWorking: Boolean(connection && connection.status === "active" && connection.voice_number && connection.forward_to_number),
  };

  return {
    connection,
    connectionError: connectionResult.error,
    env,
    indicators,
    statuses: {
      accountSid: connection?.account_sid ? "configured" : "missing",
      authToken: connection?.hasAuthToken ? "configured" : "missing",
      phoneNumber: connection?.voice_number ? "configured" : "missing",
      smsWebhook: endpointStatus({ connectionConfigured: Boolean(connection), siteUrlConfigured: env.siteUrlConfigured }),
      voiceWebhook: endpointStatus({ connectionConfigured: Boolean(connection), siteUrlConfigured: env.siteUrlConfigured }),
    },
    tableMissing: connectionResult.tableMissing,
    webhookUrls: buildWebhookUrls(),
  };
}

export function getTwilioPublicHealth() {
  const env = getTwilioEnvHealth();
  const urls = buildWebhookUrls();
  const connected = env.configEncryptionSecret && env.smsSenderConfigured && env.siteUrlConfigured;

  return {
    connected,
    env,
    statuses: {
      smsWebhook: endpointStatus({ connectionConfigured: connected, siteUrlConfigured: env.siteUrlConfigured }),
      voiceWebhook: endpointStatus({ connectionConfigured: connected, siteUrlConfigured: env.siteUrlConfigured }),
    },
    webhookUrls: urls,
  };
}
