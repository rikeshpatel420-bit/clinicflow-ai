import { NextResponse, type NextRequest } from "next/server";
import { parseTwilioFormData } from "@/lib/twilio/missed-call";
import { getTwilioConnectionForVoiceNumber, resolveTwilioSignatureAuthToken } from "@/lib/twilio/config";
import { processTwilioSmsWebhook } from "@/lib/twilio/recovery";
import { verifyTwilioSignature } from "@/lib/twilio/verification";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const payload = parseTwilioFormData(formData);
  const connectionLookup = await getTwilioConnectionForVoiceNumber(payload.To || payload.Called);
  const resolvedAuthToken = resolveTwilioSignatureAuthToken(connectionLookup.connection);
  const verification = await verifyTwilioSignature(request, {
    authToken: resolvedAuthToken.authToken,
    authTokenDecrypted: resolvedAuthToken.authTokenDecrypted,
    authTokenSource: resolvedAuthToken.authTokenSource,
    formData,
    webhookType: "sms",
  });

  if (!verification.isValid) {
    console.error("[ClinicFlow Twilio]", "sms_signature_failed", JSON.stringify(verification.diagnostics));
    return NextResponse.json(
      {
        diagnostics: verification.diagnostics,
        ok: false,
        reason: verification.reason,
      },
      { status: 401 },
    );
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
