import { NextResponse, type NextRequest } from "next/server";
import { getBackendEnv } from "@/lib/backend/env";
import { parseTwilioFormData } from "@/lib/twilio/missed-call";
import { decryptConnectionAuthToken, getTwilioConnectionForVoiceNumber } from "@/lib/twilio/config";
import { processTwilioCallWebhook } from "@/lib/twilio/recovery";
import { verifyTwilioSignature } from "@/lib/twilio/verification";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

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

  const result = await processTwilioCallWebhook(payload);
  const { siteUrl } = getBackendEnv();
  const statusUrl = `${siteUrl.replace(/\/$/, "")}/api/webhooks/twilio/status`;
  const connection = connectionLookup.connection;
  const call = "call" in result ? result.call : null;

  const body = connection?.voice_number && connection?.forward_to_number
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Dial action="${escapeXml(statusUrl)}" callerId="${escapeXml(connection.voice_number)}" timeout="20"><Number>${escapeXml(connection.forward_to_number)}</Number></Dial></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thanks for calling. A member of the team will get back to you shortly.</Say></Response>`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/xml",
      "X-ClinicFlow-Test-Mode": String(verification.isTestMode),
      "X-ClinicFlow-Processed": String(result.ok),
      "X-ClinicFlow-Status": call?.status ?? "unknown",
    },
    status: 200,
  });
}
