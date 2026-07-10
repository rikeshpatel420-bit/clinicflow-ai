import { NextResponse, type NextRequest } from "next/server";
import { getBackendEnv } from "@/lib/backend/env";
import {
  countRecentTradingWebhookRequests,
  hashRemoteKey,
  hashTradingPayload,
  persistAcceptedTradingViewSignal,
  persistRejectedTradingViewAlert,
} from "@/lib/trading/persistence";
import { defaultRateLimitMax, defaultRateLimitWindowMs, validateTradingViewPayload, type TradingWebhookResult } from "@/lib/trading/webhook";

export const dynamic = "force-dynamic";

function getProtocol(request: NextRequest) {
  return request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
}

function getRemoteKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? new URL(request.url).hostname;
}

function jsonResult(result: TradingWebhookResult) {
  return NextResponse.json(result.response, { status: result.status });
}

export async function POST(request: NextRequest) {
  const env = getBackendEnv();
  const remoteKey = getRemoteKey(request);
  const remoteKeyHash = hashRemoteKey(remoteKey);
  const context = {
    allowInsecureLocalhost: env.tradingViewWebhookAllowInsecureLocalhost,
    contentType: request.headers.get("content-type"),
    mode: env.tradingBotMode,
    protocol: getProtocol(request),
    remoteKey,
    secret: env.tradingViewWebhookSecret,
  };
  let payload: unknown;

  if (!context.contentType?.toLowerCase().includes("application/json")) {
    const payloadHash = hashTradingPayload({ contentType: context.contentType, rejected: "non-json" });
    await persistRejectedTradingViewAlert({ payload: {}, payloadHash, reason: "JSON content type is required.", remoteKeyHash });
    return jsonResult({ ok: false, status: 415, response: { accepted: false, reason: "JSON content type is required." } });
  }

  try {
    payload = await request.json();
  } catch {
    const payloadHash = hashTradingPayload({ rejected: "malformed-json" });
    await persistRejectedTradingViewAlert({ payload: {}, payloadHash, reason: "Malformed JSON payload.", remoteKeyHash });
    return jsonResult({
      ok: false,
      status: 400,
      response: { accepted: false, reason: "Malformed JSON payload." },
    });
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    const payloadHash = hashTradingPayload(payload);
    await persistRejectedTradingViewAlert({ payload: {}, payloadHash, reason: "Payload must be a JSON object.", remoteKeyHash });
    return jsonResult({
      ok: false,
      status: 400,
      response: { accepted: false, reason: "Payload must be a JSON object." },
    });
  }

  const recent = await countRecentTradingWebhookRequests(remoteKeyHash, new Date(Date.now() - defaultRateLimitWindowMs).toISOString());
  if (recent.connected && recent.count >= defaultRateLimitMax) {
    const payloadHash = hashTradingPayload(payload);
    await persistRejectedTradingViewAlert({ payload, payloadHash, reason: "Rate limit exceeded.", remoteKeyHash });
    return jsonResult({ ok: false, status: 429, response: { accepted: false, reason: "Rate limit exceeded." } });
  }

  const payloadHash = hashTradingPayload(payload);
  const result = validateTradingViewPayload(payload, context);
  if (!result.ok) {
    await persistRejectedTradingViewAlert({ payload, payloadHash, reason: result.response.reason, remoteKeyHash });
    return jsonResult(result);
  }

  const durableResult = await persistAcceptedTradingViewSignal({
    payload,
    payloadHash,
    remoteKeyHash,
    signal: result.signal,
  });

  if (!durableResult.accepted) {
    return jsonResult({ ok: false, status: durableResult.status, response: { accepted: false, reason: durableResult.reason } });
  }

  return jsonResult(result);
}
