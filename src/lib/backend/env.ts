export type BackendEnv = {
  cronSecret?: string;
  siteUrl: string;
  openaiApiKey?: string;
  openaiModel: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseUrl?: string;
  twilioConfigEncryptionSecret?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioMessagingServiceSid?: string;
  twilioPhoneNumber?: string;
  twilioWebhookSigningSecret?: string;
  twilioWebhookTestMode?: boolean;
};

function resolveSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitSiteUrl) {
    return explicitSiteUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${normalized}`;
  }

  return "http://localhost:3000";
}

export function getBackendEnv(): BackendEnv {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  return {
    cronSecret: process.env.CRON_SECRET,
    siteUrl: resolveSiteUrl(),
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    twilioConfigEncryptionSecret: process.env.TWILIO_CONFIG_ENCRYPTION_SECRET,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioMessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    twilioWebhookSigningSecret: process.env.TWILIO_WEBHOOK_SIGNING_SECRET,
    twilioWebhookTestMode: process.env.TWILIO_WEBHOOK_TEST_MODE
      ? process.env.TWILIO_WEBHOOK_TEST_MODE !== "false"
      : !isProduction,
  };
}

export function requireServiceSupabaseEnv() {
  const env = getBackendEnv();

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Missing server-only Supabase service role configuration.");
  }

  return {
    supabaseServiceRoleKey: env.supabaseServiceRoleKey,
    supabaseUrl: env.supabaseUrl,
  };
}
