export type BackendEnv = {
  cronSecret?: string;
  siteUrl: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseUrl?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWebhookSigningSecret?: string;
};

export function getBackendEnv(): BackendEnv {
  return {
    cronSecret: process.env.CRON_SECRET,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWebhookSigningSecret: process.env.TWILIO_WEBHOOK_SIGNING_SECRET,
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
