import { NextResponse, type NextRequest } from "next/server";
import { parseTwilioFormData } from "@/lib/twilio/missed-call";
import { getTwilioConnectionForVoiceNumber, resolveTwilioSignatureAuthToken } from "@/lib/twilio/config";
import { processTwilioCallWebhook } from "@/lib/twilio/recovery";
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
    webhookType: "status",
  });

  if (!verification.isValid) {
    console.error("[ClinicFlow Twilio]", "status_signature_failed", JSON.stringify(verification.diagnostics));
    return NextResponse.json(
      {
        diagnostics: verification.diagnostics,
        ok: false,
        reason: verification.reason,
      },
      { status: 401 },
    );
  }

  const result = await processTwilioCallWebhook(payload);
  const call = "call" in result ? result.call : null;

  if (!result.ok || !call) {
    return NextResponse.json(
      { ok: false, reason: result.error ?? "Twilio status webhook failed." },
      { status: verification.isTestMode ? 200 : 500 },
    );
  }

  return NextResponse.json(
    {
      callStatus: call.status,
      ok: true,
      recoveryStatus: call.recovery_status,
    },
    {
      headers: {
        "X-ClinicFlow-Test-Mode": String(verification.isTestMode),
      },
    },
  );
}
