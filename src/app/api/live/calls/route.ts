import { NextResponse, type NextRequest } from "next/server";
import { getCallDetailData } from "@/lib/calls/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const callId = request.nextUrl.searchParams.get("callId");
  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const data = await getCallDetailData(user, callId);
  return NextResponse.json(data);
}
