import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { getTradingWebhookHealth, hashTradingPayload, persistAcceptedTradingViewSignal } from "../src/lib/trading/persistence";
import { validateTradingViewPayload } from "../src/lib/trading/webhook";

loadEnvConfig(process.cwd());

const secret = process.env.TRADINGVIEW_WEBHOOK_SECRET ?? "test-secret-with-more-than-32-characters";
const now = new Date();

function payload(eventId: string, overrides: Record<string, unknown> = {}) {
  return {
    action: "BUY",
    bar_time: now.toISOString(),
    event_id: eventId,
    exchange: "NASDAQ",
    price: "172.24",
    quantity: "2",
    secret,
    strategy: "semi_trend_pullback_v1",
    strategy_version: "1.0.0",
    ticker: "AMD",
    timeframe: "1D",
    triggered_at: now.toISOString(),
    ...overrides,
  };
}

async function run() {
  const health = await getTradingWebhookHealth();
  assert.equal(health.databaseConnected, true, `Trading database is not connected or migration is not applied: ${health.message ?? "unknown"}`);

  const eventId = `db-test-${randomUUID()}`;
  const firstPayload = payload(eventId, { mode: "SIGNAL_ONLY" });
  const firstValidation = validateTradingViewPayload(firstPayload, {
    contentType: "application/json",
    mode: "SIGNAL_ONLY",
    protocol: "https",
    remoteKey: "203.0.113.10",
    secret,
  });

  assert.equal(firstValidation.ok, true);
  if (!firstValidation.ok) return;

  const first = await persistAcceptedTradingViewSignal({
    payload: firstPayload,
    payloadHash: hashTradingPayload(firstPayload),
    remoteKeyHash: "db-test-remote",
    signal: firstValidation.signal,
  });
  assert.equal(first.status, 202);
  assert.equal(first.accepted, true);

  const duplicate = await persistAcceptedTradingViewSignal({
    payload: firstPayload,
    payloadHash: hashTradingPayload(firstPayload),
    remoteKeyHash: "db-test-remote",
    signal: firstValidation.signal,
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.accepted, false);

  console.log("Trading database persistence tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
