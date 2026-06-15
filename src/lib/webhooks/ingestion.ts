export type WebhookProvider = "twilio" | "stripe" | "supabase" | "internal";

export type WebhookEnvelope = {
  provider: WebhookProvider;
  eventType: string;
  receivedAt: string;
  signatureVerified: boolean;
  testMode: boolean;
};

export function createWebhookEnvelope(provider: WebhookProvider, eventType: string, signatureVerified = false): WebhookEnvelope {
  return {
    eventType,
    provider,
    receivedAt: new Date().toISOString(),
    signatureVerified,
    testMode: true,
  };
}

export function acceptDemoWebhook(envelope: WebhookEnvelope) {
  return {
    accepted: envelope.testMode,
    envelope,
    message: "Webhook accepted in deterministic test mode only.",
  };
}

