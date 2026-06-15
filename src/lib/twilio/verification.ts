import type { NextRequest } from "next/server";

export type TwilioVerificationResult = {
  isTestMode: boolean;
  isValid: boolean;
  reason: string;
};

export function verifyTwilioSignaturePlaceholder(request: NextRequest): TwilioVerificationResult {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");
  const testMode = process.env.TWILIO_WEBHOOK_TEST_MODE !== "false";

  if (testMode) {
    return {
      isTestMode: true,
      isValid: true,
      reason: "Test mode accepts webhook payloads without live Twilio verification.",
    };
  }

  if (!authToken || !signature) {
    return {
      isTestMode: false,
      isValid: false,
      reason: "Missing Twilio auth token or signature.",
    };
  }

  return {
    isTestMode: false,
    isValid: false,
    reason: "Live Twilio signature verification is not implemented yet.",
  };
}
