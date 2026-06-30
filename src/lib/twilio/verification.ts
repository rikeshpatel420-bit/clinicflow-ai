import type { NextRequest } from "next/server";
import twilio from "twilio";
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
  rawPostParameterKeys: string[];
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

function formDataToTwilioParams(formData: FormData | null) {
  const params: Record<string, string | string[]> = {};
  const rawPostParameterKeys: string[] = [];

  if (!formData) {
    return { params, rawPostParameterKeys };
  }

  for (const [key, value] of formData.entries()) {
    rawPostParameterKeys.push(key);
    const normalizedValue = typeof value === "string" ? value : value instanceof File ? value.name : String(value);
    const existing = params[key];

    if (existing === undefined) {
      params[key] = normalizedValue;
      continue;
    }

    if (Array.isArray(existing)) {
      existing.push(normalizedValue);
      continue;
    }

    params[key] = [existing, normalizedValue];
  }

  return { params, rawPostParameterKeys };
}

function isWebhookDebugEnabled() {
  return getBackendEnv().twilioWebhookDebugMode ?? false;
}

function logTwilioValidationDebug(details: Record<string, unknown>) {
  if (!isWebhookDebugEnabled()) {
    return;
  }

  console.info("[ClinicFlow Twilio]", "signature_validation_debug", JSON.stringify(details));
}

function isTrustworthyProductionOrigin(origin?: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return false;
    }

    if (hostname.endsWith(".vercel.app")) {
      return false;
    }

    return Boolean(url.protocol === "https:" || url.protocol === "http:");
  } catch {
    return false;
  }
}

export function resolveTwilioPublicOrigin(request: NextRequest) {
  const env = getBackendEnv();
  const productionSiteUrl = env.siteUrl?.trim();
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProduction && isTrustworthyProductionOrigin(productionSiteUrl)) {
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
  const { params, rawPostParameterKeys } = formDataToTwilioParams(formData);
  const parameterCount = rawPostParameterKeys.length;
  const hostHeader = firstHeaderValue(request.headers.get("host"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const validationUrlSource: TwilioVerificationDiagnostics["validationUrlSource"] =
    isProduction && isTrustworthyProductionOrigin(env.siteUrl) ? "production-site-url" : forwardedHost ? "forwarded-headers" : "request-url";

  const resolvedPublicUrl = buildTwilioValidationUrl(request);
  const diagnosticsBase = {
    authTokenDecrypted: options?.authTokenDecrypted ?? false,
    authTokenSource: options?.authTokenSource ?? (options?.authToken ? "environment" : "missing"),
    forwardedHost,
    forwardedProto,
    hostHeader,
    parameterCount,
    rawPostParameterKeys,
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
    logTwilioValidationDebug({
      ...diagnosticsBase,
      validationMethod: "twilio.validateRequest",
      validationSignatureHeader: null,
      validationResult: false,
    });

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

  const isValid = twilio.validateRequest(authToken, signature, diagnosticsBase.resolvedPublicUrl, params);
  logTwilioValidationDebug({
    ...diagnosticsBase,
    validationMethod: "twilio.validateRequest",
    validationResult: isValid,
    validationSignatureHeader: signature,
    validationUrl: diagnosticsBase.resolvedPublicUrl,
  });

  if (!isValid) {
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
