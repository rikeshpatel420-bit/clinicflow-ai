import { NextResponse, type NextRequest } from "next/server";
import { getBackendEnv } from "@/lib/backend/env";
import { getDeploymentMode } from "@/lib/deployment/readiness";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getTwilioPublicHealth } from "@/lib/twilio/health";

export function GET(request: NextRequest) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const env = getBackendEnv();
  const twilio = getTwilioPublicHealth(request.nextUrl.origin);
  const runtime = {
    isProduction: process.env.NODE_ENV === "production",
    nodeEnv: process.env.NODE_ENV ?? "development",
    vercelDetected: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  };

  return NextResponse.json({
    app: "ClinicFlow AI",
    diagnostics: {
      openAiConfigured: Boolean(env.openaiApiKey),
      supabaseServiceRoleConfigured: Boolean(env.supabaseServiceRoleKey),
      twilioConfigEncryptionSecretConfigured: Boolean(env.twilioConfigEncryptionSecret),
      twilioSenderConfigured: Boolean(env.twilioMessagingServiceSid || env.twilioPhoneNumber),
    },
    mode: getDeploymentMode(),
    runtime,
    status: twilio.connected ? "ok" : "degraded",
    twilio,
    supabaseConfigured: isSupabaseConfigured,
    testMode: env.twilioWebhookTestMode,
  });
}

