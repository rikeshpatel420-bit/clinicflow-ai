import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getBackendEnv } from "@/lib/backend/env";

export type TwilioVerificationResult = {
  isTestMode: boolean;
  isValid: boolean;
  reason: string;
};

function buildTwilioSignaturePayload(request: NextRequest, formData: FormData | null) {
  const url = new URL(request.url);
  const base = url.toString();

  if (!formData) {
    return base;
  }

  const params = Array.from(formData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${String(value)}`)
    .join("");

  return `${base}${params}`;
}

export async function verifyTwilioSignature(
  request: NextRequest,
  options?: { authToken?: string | null; formData?: FormData | null },
): Promise<TwilioVerificationResult> {
  const env = getBackendEnv();

  if (env.twilioWebhookTestMode) {
    return {
      isTestMode: true,
      isValid: true,
      reason: "Test mode accepts webhook payloads without live Twilio verification.",
    };
  }

  const authToken = options?.authToken ?? env.twilioAuthToken;

  if (!authToken) {
    return {
      isTestMode: false,
      isValid: false,
      reason: "Missing Twilio auth token.",
    };
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) {
    return {
      isTestMode: false,
      isValid: false,
      reason: "Missing Twilio signature.",
    };
  }

  const formData = options?.formData ?? (await request.clone().formData().catch(() => null));
  const payload = buildTwilioSignaturePayload(request, formData);
  const expected = createHmac("sha1", authToken).update(payload, "utf8").digest("base64");

  try {
    const expectedBytes = Buffer.from(expected, "utf8");
    const providedBytes = Buffer.from(signature, "utf8");

    if (expectedBytes.length !== providedBytes.length) {
      return {
        isTestMode: false,
        isValid: false,
        reason: "Invalid Twilio signature.",
      };
    }

    if (!timingSafeEqual(expectedBytes, providedBytes)) {
      return {
        isTestMode: false,
        isValid: false,
        reason: "Invalid Twilio signature.",
      };
    }
  } catch {
    return {
      isTestMode: false,
      isValid: false,
      reason: "Invalid Twilio signature.",
    };
  }

  return {
    isTestMode: false,
    isValid: true,
    reason: "Signature verified.",
  };
}
