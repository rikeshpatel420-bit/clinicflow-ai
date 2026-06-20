import { NextResponse, type NextRequest } from "next/server";
import { parseTwilioFormData } from "@/lib/twilio/missed-call";
import { decryptConnectionAuthToken, getTwilioConnectionForVoiceNumber } from "@/lib/twilio/config";
import { processTwilioSmsWebhook } from "@/lib/twilio/recovery";
import { verifyTwilioSignature } from "@/lib/twilio/verification";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = parseTwilioFormData(formData);
  const connectionLookup = await getTwilioConnectionForVoiceNumber(payload.To || payload.Called);
  const verification = await verifyTwilioSignature(request, {
    authToken: connectionLookup.connection ? decryptConnectionAuthToken(connectionLookup.connection) : null,
    formData,
  });

  if (!verification.isValid) {
    return NextResponse.json({ ok: false, reason: verification.reason }, { status: 401 });
  }

  const result = await processTwilioSmsWebhook(payload);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.error ?? "Twilio SMS webhook failed." },
      { status: verification.isTestMode ? 200 : 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      replyState: result.replyState,
    },
    {
      headers: {
        "X-ClinicFlow-Test-Mode": String(verification.isTestMode),
      },
    },
  );
}
