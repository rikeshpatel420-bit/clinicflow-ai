import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { validateTradingViewPayload } from "../src/lib/trading/webhook";

const secret = "test-secret-with-more-than-32-characters";

function payload(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    action: "BUY",
    bar_time: now.toISOString(),
    event_id: `event-${randomUUID()}`,
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

function context(overrides: Record<string, unknown> = {}) {
  return {
    contentType: "application/json",
    mode: "SIGNAL_ONLY" as const,
    protocol: "https",
    remoteKey: "203.0.113.10",
    secret,
    ...overrides,
  };
}

function webhookHealthValidationTest() {
  const result = validateTradingViewPayload(payload(), context());
  assert.equal(result.status, 202);
  assert.equal(result.ok, true);
}

function staleAlertTest() {
  const stale = new Date(Date.now() - 61_000).toISOString();
  const result = validateTradingViewPayload(payload({ triggered_at: stale }), context());
  assert.equal(result.status, 408);
  assert.equal(result.ok, false);
}

function invalidSecretTest() {
  const result = validateTradingViewPayload(payload({ secret: "wrong-secret-with-more-than-32-characters" }), context());
  assert.equal(result.status, 401);
  assert.equal(result.ok, false);
}

function malformedPayloadTest() {
  const result = validateTradingViewPayload(payload({ price: "not-a-number" }), context());
  assert.equal(result.status, 400);
  assert.equal(result.ok, false);
}

function signalOnlyOrPaperOnlyTest() {
  const result = validateTradingViewPayload(payload({ mode: "BACKTEST" }), context());
  assert.equal(result.status, 400);
  assert.equal(result.ok, false);
}

webhookHealthValidationTest();
staleAlertTest();
invalidSecretTest();
malformedPayloadTest();
signalOnlyOrPaperOnlyTest();

console.log("TradingView webhook validation tests passed.");
