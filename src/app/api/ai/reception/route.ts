import { NextResponse } from "next/server";
import { getReceptionConsoleData } from "@/lib/reception/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const data = await getReceptionConsoleData(user);
  return NextResponse.json(data);
}
