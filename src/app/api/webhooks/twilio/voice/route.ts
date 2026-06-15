import { NextResponse, type NextRequest } from "next/server";
import { detectMissedCall, parseTwilioFormData } from "@/lib/twilio/missed-call";
import { verifyTwilioSignaturePlaceholder } from "@/lib/twilio/verification";

export async function POST(request: NextRequest) {
  const verification = verifyTwilioSignaturePlaceholder(request);

  if (!verification.isValid) {
    return NextResponse.json({ ok: false, reason: verification.reason }, { status: 401 });
  }

  const payload = parseTwilioFormData(await request.formData());
  const detection = detectMissedCall(payload);

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say>ClinicFlow test mode webhook received.</Say></Response>`,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-ClinicFlow-Test-Mode": String(verification.isTestMode),
        "X-ClinicFlow-Missed-Call": String(detection.isMissed),
      },
      status: 200,
    },
  );
}
