import { NextResponse, type NextRequest } from "next/server";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getCurrentUser } from "@/lib/supabase/server";
import { getTwilioProductionSelfTest } from "@/lib/twilio/setup-check";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return NextResponse.json({ error: "No active clinic membership found." }, { status: 403 });
  }

  const result = await getTwilioProductionSelfTest({
    baseUrl: request.nextUrl.origin,
    clinicId: membership.clinic_id,
    role: membership.role,
  });

  return NextResponse.json({
    ...result,
    clinicId: membership.clinic_id,
    role: membership.role,
    userId: user.id,
  });
}
