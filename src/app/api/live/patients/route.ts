import { NextResponse, type NextRequest } from "next/server";
import { getPatientDetailData } from "@/lib/patients/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  }

  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const data = await getPatientDetailData(user, patientId);
  return NextResponse.json(data);
}
