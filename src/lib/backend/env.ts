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
  twilioWhatsappFrom?: string;
  twilioWebhookDebugMode?: boolean;
  twilioWebhookSigningSecret?: string;
  twilioWebhookTestMode?: boolean;
  tradingBotMode: "PAPER" | "SIGNAL_ONLY";
  tradingViewWebhookAllowInsecureLocalhost: boolean;
  tradingViewWebhookSecret?: string;
  liveTradingEnabled: false;
};

function resolveSiteUrl() {
  const explicitSiteUrl = process.env.APP_BASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SITE_URL?.trim();
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
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    twilioConfigEncryptionSecret: process.env.TWILIO_CONFIG_ENCRYPTION_SECRET,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioMessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
    twilioWebhookDebugMode: process.env.TWILIO_WEBHOOK_DEBUG ? process.env.TWILIO_WEBHOOK_DEBUG !== "false" : false,
    twilioWebhookSigningSecret: process.env.TWILIO_WEBHOOK_SIGNING_SECRET,
    twilioWebhookTestMode: process.env.TWILIO_WEBHOOK_TEST_MODE
      ? process.env.TWILIO_WEBHOOK_TEST_MODE !== "false"
      : !isProduction,
    tradingBotMode: process.env.SIGNAL_MODE === "PAPER" || process.env.TRADING_BOT_MODE === "PAPER" ? "PAPER" : "SIGNAL_ONLY",
    tradingViewWebhookAllowInsecureLocalhost: process.env.TRADINGVIEW_WEBHOOK_ALLOW_INSECURE_LOCALHOST === "true" && !isProduction,
    tradingViewWebhookSecret: process.env.TRADINGVIEW_WEBHOOK_SECRET,
    liveTradingEnabled: false,
  };
}

export function validateTradingProductionEnv() {
  const env = getBackendEnv();
  const missing: string[] = [];

  if (!env.tradingViewWebhookSecret || env.tradingViewWebhookSecret.length < 32) missing.push("TRADINGVIEW_WEBHOOK_SECRET");
  if (!env.supabaseUrl) missing.push("SUPABASE_URL");
  if (!env.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.siteUrl.startsWith("https://") && process.env.NODE_ENV === "production") missing.push("APP_BASE_URL");

  return {
    ok: missing.length === 0,
    missing,
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
