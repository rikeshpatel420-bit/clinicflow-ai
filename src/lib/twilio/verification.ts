import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getBackendEnv } from "@/lib/backend/env";

export type TwilioWebhookType = "missed-call" | "sms" | "status" | "voice" | "voicemail" | "unknown";

export type TwilioAuthTokenSource = "clinic-row" | "environment" | "missing";

export type TwilioVerificationDiagnostics = {
  authTokenDecrypted: boolean;
  authTokenSource: TwilioAuthTokenSource;
  forwardedHost: string | null;
  forwardedProto: string | null;
  hostHeader: string | null;
  parameterCount: number;
  requestPath: string;
  requestUrl: string;
  resolvedPublicUrl: string;
  signatureHeaderExists: boolean;
  validationResult: "valid" | "invalid" | "missing-signature" | "missing-token" | "test-mode";
  validationUrlSource: "production-site-url" | "forwarded-headers" | "request-url";
  usedHttps: boolean;
  usedWww: boolean;
  webhookType: TwilioWebhookType;
};

export type TwilioVerificationResult = {
  diagnostics: TwilioVerificationDiagnostics;
  isTestMode: boolean;
  isValid: boolean;
  reason: string;
};

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? null;
}

export function resolveTwilioPublicOrigin(request: NextRequest) {
  const env = getBackendEnv();
  const productionSiteUrl = env.siteUrl?.trim();
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProduction && productionSiteUrl) {
    return new URL(productionSiteUrl).origin.replace(/\/$/, "");
  }

  const forwardedHost =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ??
    firstHeaderValue(request.headers.get("x-original-host")) ??
    firstHeaderValue(request.headers.get("host"));
  const fallbackOrigin = new URL(request.url).origin.replace(/\/$/, "");

  if (!forwardedHost) {
    return fallbackOrigin;
  }

  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    (/(?:^|,)\s*(localhost|127\.0\.0\.1)(?:\s*|,|$)/i.test(forwardedHost) ? "http" : "https");

  return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
}

export function buildTwilioValidationUrl(request: NextRequest) {
  const origin = resolveTwilioPublicOrigin(request);
  const { pathname, search } = new URL(request.url);
  return `${origin}${pathname}${search}`;
}

export function buildTwilioSignaturePayload(url: string, formData: FormData | null) {
  if (!formData) {
    return url;
  }

  const params = Array.from(formData.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}${String(value)}`)
    .join("");

  return `${url}${params}`;
}

export function createTwilioRequestSignature(url: string, authToken: string, formData: FormData | null) {
  const payload = buildTwilioSignaturePayload(url, formData);
  return createHmac("sha1", authToken).update(payload, "utf8").digest("base64");
}

export async function verifyTwilioSignature(
  request: NextRequest,
  options?: {
    authToken?: string | null;
    authTokenDecrypted?: boolean;
    authTokenSource?: TwilioAuthTokenSource;
    formData?: FormData | null;
    webhookType?: TwilioWebhookType;
  },
): Promise<TwilioVerificationResult> {
  const env = getBackendEnv();
  const requestUrl = new URL(request.url);
  const formData = options?.formData ?? (await request.clone().formData().catch(() => null));
  const parameterCount = formData ? Array.from(formData.entries()).length : 0;
  const hostHeader = firstHeaderValue(request.headers.get("host"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const validationUrlSource: TwilioVerificationDiagnostics["validationUrlSource"] =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
      ? "production-site-url"
      : forwardedHost
        ? "forwarded-headers"
        : "request-url";

  const resolvedPublicUrl = buildTwilioValidationUrl(request);
  const diagnosticsBase = {
    authTokenDecrypted: options?.authTokenDecrypted ?? false,
    authTokenSource: options?.authTokenSource ?? (options?.authToken ? "environment" : "missing"),
    forwardedHost,
    forwardedProto,
    hostHeader,
    parameterCount,
    requestPath: requestUrl.pathname,
    requestUrl: requestUrl.toString(),
    resolvedPublicUrl,
    signatureHeaderExists: Boolean(request.headers.get("x-twilio-signature")),
    validationUrlSource,
    usedHttps: resolvedPublicUrl.startsWith("https://"),
    usedWww: /(^|\/\/)www\./i.test(resolvedPublicUrl),
    webhookType: options?.webhookType ?? "unknown",
  } satisfies Omit<TwilioVerificationDiagnostics, "validationResult">;

  if (env.twilioWebhookTestMode) {
    return {
      diagnostics: {
        ...diagnosticsBase,
        validationResult: "test-mode",
      },
      isTestMode: true,
      isValid: true,
      reason: "Test mode accepts webhook payloads without live Twilio verification.",
    };
  }

  const authToken = options?.authToken ?? env.twilioAuthToken;

  if (!authToken) {
    return {
      diagnostics: {
        ...diagnosticsBase,
        authTokenSource: "missing",
        validationResult: "missing-token",
      },
      isTestMode: false,
      isValid: false,
      reason: "Missing Twilio auth token.",
    };
  }

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) {
    return {
      diagnostics: {
        ...diagnosticsBase,
        validationResult: "missing-signature",
      },
      isTestMode: false,
      isValid: false,
      reason: "Missing Twilio signature.",
    };
  }

  const expected = createTwilioRequestSignature(diagnosticsBase.resolvedPublicUrl, authToken, formData);

  try {
    const expectedBytes = Buffer.from(expected, "utf8");
    const providedBytes = Buffer.from(signature, "utf8");

    if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
      return {
        diagnostics: {
          ...diagnosticsBase,
          validationResult: "invalid",
        },
        isTestMode: false,
        isValid: false,
        reason: "Invalid Twilio signature.",
      };
    }
  } catch {
    return {
      diagnostics: {
        ...diagnosticsBase,
        validationResult: "invalid",
      },
      isTestMode: false,
      isValid: false,
      reason: "Invalid Twilio signature.",
    };
  }

  return {
    diagnostics: {
      ...diagnosticsBase,
      validationResult: "valid",
    },
    isTestMode: false,
    isValid: true,
    reason: "Signature verified.",
  };
}
