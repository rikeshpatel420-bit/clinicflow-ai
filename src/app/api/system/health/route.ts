import { NextResponse } from "next/server";
import { getDeploymentMode } from "@/lib/deployment/readiness";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function GET() {
  const { isSupabaseConfigured } = getSupabaseEnv();

  return NextResponse.json({
    app: "ClinicFlow AI",
    mode: getDeploymentMode(),
    status: "ok",
    supabaseConfigured: isSupabaseConfigured,
    testMode: true,
  });
}

