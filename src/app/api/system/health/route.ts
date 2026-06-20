import { NextResponse, type NextRequest } from "next/server";
import { getBackendEnv } from "@/lib/backend/env";
import { getDeploymentMode } from "@/lib/deployment/readiness";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getTwilioPublicHealth } from "@/lib/twilio/health";

export function GET(request: NextRequest) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const env = getBackendEnv();
  const twilio = getTwilioPublicHealth(request.nextUrl.origin);

  return NextResponse.json({
    app: "ClinicFlow AI",
    mode: getDeploymentMode(),
    status: twilio.connected ? "ok" : "degraded",
    twilio,
    supabaseConfigured: isSupabaseConfigured,
    testMode: env.twilioWebhookTestMode,
  });
}

