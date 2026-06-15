import { NextResponse, type NextRequest } from "next/server";
import { detectMissedCall, parseTwilioFormData } from "@/lib/twilio/missed-call";
import { createRecoverySmsDraft, queueRecoverySmsPlaceholder } from "@/lib/twilio/sms";
import { verifyTwilioSignaturePlaceholder } from "@/lib/twilio/verification";

export async function POST(request: NextRequest) {
  const verification = verifyTwilioSignaturePlaceholder(request);

  if (!verification.isValid) {
    return NextResponse.json({ ok: false, reason: verification.reason }, { status: 401 });
  }

  const payload = parseTwilioFormData(await request.formData());
  const detection = detectMissedCall(payload);
  const draft = detection.isMissed
    ? await queueRecoverySmsPlaceholder(
        createRecoverySmsDraft({
          patientPhone: detection.callerNumber,
        }),
      )
    : null;

  return NextResponse.json({
    detection,
    draft,
    mode: verification.isTestMode ? "test" : "unconfigured",
    ok: true,
  });
}
