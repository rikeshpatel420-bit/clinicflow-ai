import crypto from "node:crypto";
import { allowedTradingTickers, type TradingAction, type TradingMode, type TradingSignal, type TradingViewWebhookPayload } from "@/lib/trading/types";

export const defaultStaleWindowMs = 60_000;
export const defaultRateLimitWindowMs = 60_000;
export const defaultRateLimitMax = 30;

export type WebhookContext = {
  contentType: string | null;
  protocol: string;
  remoteKey: string;
  now?: Date;
  secret?: string;
  mode?: TradingMode;
  staleWindowMs?: number;
  allowInsecureLocalhost?: boolean;
};

export type TradingWebhookValidationResult =
  | { ok: true; status: 202; signal: TradingSignal; response: { accepted: true; event_id: string; mode: TradingMode; queued: true } }
  | { ok: false; status: number; response: { accepted: false; reason: string } };

export type TradingWebhookResult =
  | { ok: true; status: 202; response: { accepted: true; event_id: string; mode: TradingMode; queued: true } }
  | { ok: false; status: number; response: { accepted: false; reason: string } };

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

function normalizeAction(value: unknown): TradingAction | null {
  const action = normalizeString(value).toUpperCase();
  if (action === "BUY" || action === "SELL" || action === "REDUCE" || action === "HOLD") return action;
  if (action === "LONG") return "BUY";
  if (action === "SHORT") return "SELL";
  return null;
}

function normalizeMode(value: unknown, fallback: TradingMode): TradingMode | null {
  const mode = normalizeString(value || fallback).toUpperCase();
  if (mode === "PAPER" || mode === "SIGNAL_ONLY") return mode;
  return null;
}

export function parseTradingTimestamp(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const date = new Date(value > 10_000_000_000 ? value : value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = normalizeString(value);
  if (!text) return null;

  if (/^\d+$/.test(text)) {
    const numeric = Number(text);
    const date = new Date(numeric > 10_000_000_000 ? numeric : numeric * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timingSafeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function reject(status: number, reason: string): TradingWebhookValidationResult {
  return { ok: false, status, response: { accepted: false, reason } };
}

function validateSecret(secret: string | undefined, payloadSecret: string) {
  if (!secret || secret.length < 32) return "Webhook secret is not configured with at least 32 characters.";
  if (!payloadSecret || !timingSafeEqualText(payloadSecret, secret)) return "Invalid webhook secret.";
  return null;
}

export function validateTradingViewPayload(payload: TradingViewWebhookPayload, context: WebhookContext): TradingWebhookValidationResult {
  const now = context.now ?? new Date();
  const protocol = context.protocol.toLowerCase();
  const insecureAllowed = context.allowInsecureLocalhost && context.remoteKey.includes("localhost");

  if (protocol !== "https" && !insecureAllowed) return reject(426, "HTTPS is required.");
  if (!context.contentType?.toLowerCase().includes("application/json")) return reject(415, "JSON content type is required.");

  const secretError = validateSecret(context.secret, normalizeString(payload.secret));
  if (secretError) return reject(secretError.startsWith("Webhook") ? 500 : 401, secretError);

  const eventId = normalizeString(payload.event_id);
  const strategy = normalizeString(payload.strategy);
  const strategyVersion = normalizeString(payload.strategy_version);
  const ticker = normalizeString(payload.ticker).toUpperCase();
  const exchange = normalizeString(payload.exchange).toUpperCase();
  const timeframe = normalizeString(payload.timeframe);
  const action = normalizeAction(payload.action);
  const mode = normalizeMode(payload.mode, context.mode ?? "SIGNAL_ONLY");
  const price = normalizeNumber(payload.price);
  const quantity = normalizeNumber(payload.quantity);
  const barTime = parseTradingTimestamp(payload.bar_time);
  const triggeredAt = parseTradingTimestamp(payload.triggered_at);

  if (!eventId || eventId.length > 160 || !/^[A-Za-z0-9._:-]+$/.test(eventId)) return reject(400, "Invalid event_id.");
  if (!strategy || !/^[A-Za-z0-9_-]{3,80}$/.test(strategy)) return reject(400, "Invalid strategy.");
  if (!/^\d+\.\d+\.\d+$/.test(strategyVersion)) return reject(400, "Invalid strategy_version.");
  if (!allowedTradingTickers.includes(ticker as (typeof allowedTradingTickers)[number])) return reject(400, "Unsupported ticker.");
  if (!exchange || !/^[A-Z0-9._:-]{2,20}$/.test(exchange)) return reject(400, "Invalid exchange.");
  if (!timeframe || !/^[A-Za-z0-9]+$/.test(timeframe)) return reject(400, "Invalid timeframe.");
  if (!action) return reject(400, "Invalid action.");
  if (!mode) return reject(400, "Invalid mode.");
  if (!Number.isFinite(price) || price <= 0) return reject(400, "Invalid price.");
  if (!Number.isFinite(quantity) || quantity < 0) return reject(400, "Invalid quantity.");
  if (!barTime || !triggeredAt) return reject(400, "Invalid timestamp.");

  const ageMs = now.getTime() - triggeredAt.getTime();
  const staleWindowMs = context.staleWindowMs ?? defaultStaleWindowMs;
  if (ageMs < -5_000) return reject(400, "Alert timestamp is in the future.");
  if (ageMs > staleWindowMs) return reject(408, "Alert is stale.");

  const signal: TradingSignal = {
    action,
    barTime: barTime.toISOString(),
    eventId,
    exchange,
    mode,
    price,
    quantity,
    receivedAt: now.toISOString(),
    strategy,
    strategyVersion,
    ticker: ticker as TradingSignal["ticker"],
    timeframe,
    triggeredAt: triggeredAt.toISOString(),
  };

  return { ok: true, status: 202, signal, response: { accepted: true, event_id: eventId, mode, queued: true } };
}

export function redactTradingViewPayload(payload: TradingViewWebhookPayload) {
  return {
    ...payload,
    secret: payload.secret ? "[REDACTED]" : undefined,
  };
}

export const exampleTradingViewPayload = {
  secret: "{{WEBHOOK_SECRET}}",
  event_id: "{{strategy.order.id}}-{{timenow}}",
  strategy: "semi_trend_pullback_v1",
  strategy_version: "1.0.0",
  ticker: "{{ticker}}",
  exchange: "{{exchange}}",
  timeframe: "{{interval}}",
  action: "{{strategy.order.action}}",
  price: "{{close}}",
  quantity: "{{strategy.order.contracts}}",
  bar_time: "{{time}}",
  triggered_at: "{{timenow}}",
};
