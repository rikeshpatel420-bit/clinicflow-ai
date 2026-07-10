import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getBackendEnv } from "@/lib/backend/env";
import type { TradingSignal, TradingViewWebhookPayload } from "@/lib/trading/types";
import { parseTradingTimestamp, redactTradingViewPayload } from "@/lib/trading/webhook";

export type TradingWebhookHealth = {
  configured: boolean;
  databaseConnected: boolean;
  latestAcceptedWebhookAt: string | null;
  latestRejectedWebhookAt: string | null;
  currentOperatingMode: "PAPER" | "SIGNAL_ONLY";
  liveExecutionEnabled: false;
  message?: string;
  migrationObjects?: {
    auditLog: boolean;
    acceptRpc: boolean;
    rejectRpc: boolean;
  };
};

export type DurableAcceptResult = {
  accepted: boolean;
  status: number;
  reason: string;
};

type SupabaseRpcResult = {
  accepted?: boolean;
  status?: number;
  reason?: string;
};

function getSupabaseServerConfig() {
  const env = getBackendEnv();
  const supabaseUrl = env.supabaseUrl;
  const supabaseServiceRoleKey = env.supabaseServiceRoleKey;

  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return { supabaseServiceRoleKey, supabaseUrl };
}

function createTradingSupabaseClient() {
  const config = getSupabaseServerConfig();
  if (!config) return null;

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hashTradingPayload(payload: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function hashRemoteKey(remoteKey: string) {
  return crypto.createHash("sha256").update(remoteKey).digest("hex");
}

export function createWebhookNonce(eventId: string, triggeredAt: string, payloadHash: string) {
  return crypto.createHash("sha256").update(`${eventId}:${triggeredAt}:${payloadHash}`).digest("hex");
}

function asRpcResult(value: unknown): DurableAcceptResult {
  const data = typeof value === "object" && value !== null ? (value as SupabaseRpcResult) : {};
  return {
    accepted: data.accepted === true,
    reason: typeof data.reason === "string" ? data.reason : "Database accepted webhook request.",
    status: typeof data.status === "number" ? data.status : data.accepted === true ? 202 : 409,
  };
}

export async function checkTradingDatabaseConnection() {
  const supabase = createTradingSupabaseClient();
  if (!supabase) return { connected: false, message: "Supabase service configuration is missing." };

  const { error } = await supabase.from("tradingview_webhook_events").select("id", { count: "exact", head: true }).limit(1);
  if (error) return { connected: false, message: error.message };
  return { connected: true };
}

export async function requestTradingSchemaReload() {
  const supabase = createTradingSupabaseClient();
  if (!supabase) return { ok: false, message: "Supabase service configuration is missing." };

  const { error } = await supabase.rpc("reload_trading_postgrest_schema");
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function countRecentTradingWebhookRequests(remoteKeyHash: string, sinceIso: string) {
  const supabase = createTradingSupabaseClient();
  if (!supabase) return { count: 0, connected: false };

  const { count, error } = await supabase
    .from("trading_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("remote_key_hash", remoteKeyHash)
    .gte("received_at", sinceIso);

  if (error) return { count: 0, connected: false, message: error.message };
  return { count: count ?? 0, connected: true };
}

export async function persistAcceptedTradingViewSignal({
  payload,
  payloadHash,
  remoteKeyHash,
  signal,
}: {
  payload: TradingViewWebhookPayload;
  payloadHash: string;
  remoteKeyHash: string;
  signal: TradingSignal;
}): Promise<DurableAcceptResult> {
  const supabase = createTradingSupabaseClient();
  if (!supabase) {
    return { accepted: false, status: 503, reason: "Trading database is not configured." };
  }

  const nonce = createWebhookNonce(signal.eventId, signal.triggeredAt, payloadHash);
  const { data, error } = await supabase.rpc("accept_tradingview_webhook_event", {
    p_action: signal.action,
    p_event_id: signal.eventId,
    p_exchange: signal.exchange,
    p_nonce: nonce,
    p_operating_mode: signal.mode,
    p_payload_hash: payloadHash,
    p_price: signal.price,
    p_quantity: signal.quantity,
    p_received_at: signal.receivedAt,
    p_redacted_payload: redactTradingViewPayload(payload),
    p_remote_key_hash: remoteKeyHash,
    p_strategy: signal.strategy,
    p_strategy_version: signal.strategyVersion,
    p_ticker: signal.ticker,
    p_timeframe: signal.timeframe,
    p_triggered_at: signal.triggeredAt,
  });

  if (error) {
    return { accepted: false, status: 503, reason: `Trading database write failed: ${error.message}` };
  }

  return asRpcResult(data);
}

export async function persistRejectedTradingViewAlert({
  payload,
  payloadHash,
  reason,
  remoteKeyHash,
}: {
  payload: TradingViewWebhookPayload;
  payloadHash: string;
  reason: string;
  remoteKeyHash: string;
}) {
  const supabase = createTradingSupabaseClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const eventId = typeof payload.event_id === "string" ? payload.event_id : "";
  const parsedTriggeredAt = parseTradingTimestamp(payload.triggered_at);
  const triggeredAt = parsedTriggeredAt?.toISOString() ?? null;
  const nonce = eventId && triggeredAt ? createWebhookNonce(eventId, triggeredAt, payloadHash) : null;

  await supabase.rpc("reject_tradingview_webhook_event", {
    p_action: typeof payload.action === "string" ? payload.action : "",
    p_event_id: eventId,
    p_exchange: typeof payload.exchange === "string" ? payload.exchange : "",
    p_nonce: nonce,
    p_operating_mode: "SIGNAL_ONLY",
    p_payload_hash: payloadHash,
    p_price: Number.isFinite(Number(payload.price)) ? Number(payload.price) : null,
    p_quantity: Number.isFinite(Number(payload.quantity)) ? Number(payload.quantity) : null,
    p_received_at: now,
    p_redacted_payload: redactTradingViewPayload(payload),
    p_rejection_reason: reason,
    p_remote_key_hash: remoteKeyHash,
    p_strategy: typeof payload.strategy === "string" ? payload.strategy : "",
    p_strategy_version: typeof payload.strategy_version === "string" ? payload.strategy_version : "",
    p_ticker: typeof payload.ticker === "string" ? payload.ticker : "",
    p_timeframe: typeof payload.timeframe === "string" ? payload.timeframe : "",
    p_triggered_at: triggeredAt,
  });
}

export async function getTradingWebhookHealth(): Promise<TradingWebhookHealth> {
  const env = getBackendEnv();
  const supabase = createTradingSupabaseClient();
  const base = {
    configured: Boolean(env.tradingViewWebhookSecret && env.tradingViewWebhookSecret.length >= 32),
    currentOperatingMode: env.tradingBotMode,
    databaseConnected: false,
    latestAcceptedWebhookAt: null,
    latestRejectedWebhookAt: null,
    liveExecutionEnabled: false as const,
  };

  if (!supabase) {
    return { ...base, message: "Supabase service configuration is missing." };
  }

  const [accepted, rejected] = await Promise.all([
    supabase
      .from("trading_audit_log")
      .select("received_at")
      .eq("processing_status", "ACCEPTED")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("trading_audit_log")
      .select("received_at")
      .eq("processing_status", "REJECTED")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const error = accepted.error ?? rejected.error;
  if (error) {
    return {
      ...base,
      message: error.message,
      migrationObjects: {
        acceptRpc: false,
        auditLog: false,
        rejectRpc: false,
      },
    };
  }

  return {
    ...base,
    databaseConnected: true,
    latestAcceptedWebhookAt: typeof accepted.data?.received_at === "string" ? accepted.data.received_at : null,
    latestRejectedWebhookAt: typeof rejected.data?.received_at === "string" ? rejected.data.received_at : null,
    migrationObjects: {
      acceptRpc: true,
      auditLog: true,
      rejectRpc: true,
    },
  };
}
