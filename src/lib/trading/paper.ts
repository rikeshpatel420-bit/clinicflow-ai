import crypto from "node:crypto";
import { getTradingRuntimeState } from "@/lib/trading/store";
import type { PaperOrder, TradingSignal } from "@/lib/trading/types";

export function createPaperOrderFromSignal(signal: TradingSignal): PaperOrder | null {
  if (signal.mode !== "PAPER" || signal.action === "HOLD") return null;

  const state = getTradingRuntimeState();
  const existing = state.paperOrders.find((order) => order.eventId === signal.eventId);
  if (existing) return existing;

  const order: PaperOrder = {
    action: signal.action,
    consideration: Number((signal.price * signal.quantity).toFixed(2)),
    createdAt: new Date().toISOString(),
    eventId: signal.eventId,
    exchange: signal.exchange,
    id: crypto.randomUUID(),
    mode: "PAPER",
    price: signal.price,
    quantity: signal.quantity,
    status: "SIMULATED",
    ticker: signal.ticker,
  };

  state.paperOrders.push(order);
  return order;
}
