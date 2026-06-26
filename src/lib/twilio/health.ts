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
    statusWebhook: TwilioEndpointStatus;
    smsWebhook: TwilioEndpointStatus;
  };
  tableMissing: boolean;
  webhookUrls: {
    sms: string;
    status: string;
    voice: string;
  };
};

function baseUrl(override?: string | null) {
  const fallback = getBackendEnv().siteUrl;
  return (override ?? fallback).replace(/\/$/, "");
}

function buildWebhookUrls(override?: string | null) {
  const origin = baseUrl(override);
  return {
    sms: `${origin}/api/twilio/sms`,
    status: `${origin}/api/twilio/status`,
    voice: `${origin}/api/twilio/voice`,
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

export async function getTwilioSetupHealthForClinic(clinicId: string, options?: { baseUrl?: string | null }): Promise<TwilioSetupHealth> {
  const env = getTwilioEnvHealth();
  const resolvedSiteUrlConfigured = Boolean(options?.baseUrl ?? getBackendEnv().siteUrl);
  const connectionResult = await getTwilioConnectionForClinic(clinicId);
  const connection = toTwilioConnectionView(connectionResult.connection);
  const indicators = {
    connected: Boolean(
      connection &&
        connection.status === "active" &&
        connection.account_sid &&
        connection.hasAuthToken &&
        connection.voice_number &&
        env.configEncryptionSecret &&
        resolvedSiteUrlConfigured,
    ),
    phoneNumberActive: Boolean(connection?.voice_number),
    smsWorking: Boolean(connection && connection.status === "active" && env.smsSenderConfigured),
    voiceWorking: Boolean(connection && connection.status === "active" && connection.voice_number && connection.forward_to_number),
  };

  return {
    connection,
    connectionError: connectionResult.error,
    env: {
      ...env,
      siteUrlConfigured: resolvedSiteUrlConfigured,
    },
    indicators,
    statuses: {
      accountSid: connection?.account_sid ? "configured" : "missing",
      authToken: connection?.hasAuthToken ? "configured" : "missing",
      phoneNumber: connection?.voice_number ? "configured" : "missing",
      smsWebhook: endpointStatus({ connectionConfigured: Boolean(connection), siteUrlConfigured: resolvedSiteUrlConfigured }),
      voiceWebhook: endpointStatus({ connectionConfigured: Boolean(connection), siteUrlConfigured: resolvedSiteUrlConfigured }),
      statusWebhook: endpointStatus({ connectionConfigured: Boolean(connection), siteUrlConfigured: resolvedSiteUrlConfigured }),
    },
    tableMissing: connectionResult.tableMissing,
    webhookUrls: buildWebhookUrls(options?.baseUrl),
  };
}

export function getTwilioPublicHealth(baseUrlOverride?: string | null) {
  const env = getTwilioEnvHealth();
  const urls = buildWebhookUrls(baseUrlOverride);
  const resolvedSiteUrlConfigured = Boolean(baseUrlOverride ?? getBackendEnv().siteUrl);
  const connected = env.configEncryptionSecret && env.smsSenderConfigured && resolvedSiteUrlConfigured;

  return {
    connected,
    env: {
      ...env,
      siteUrlConfigured: resolvedSiteUrlConfigured,
    },
    statuses: {
      statusWebhook: endpointStatus({ connectionConfigured: connected, siteUrlConfigured: resolvedSiteUrlConfigured }),
      smsWebhook: endpointStatus({ connectionConfigured: connected, siteUrlConfigured: resolvedSiteUrlConfigured }),
      voiceWebhook: endpointStatus({ connectionConfigured: connected, siteUrlConfigured: resolvedSiteUrlConfigured }),
    },
    webhookUrls: urls,
  };
}
