import type { PaperOrder, QueuedTradingSignal, TradingAlertAuditRecord } from "@/lib/trading/types";

type TradingRuntimeState = {
  auditRecords: TradingAlertAuditRecord[];
  eventIds: Set<string>;
  nonces: Set<string>;
  queue: QueuedTradingSignal[];
  paperOrders: PaperOrder[];
  rateLimits: Map<string, number[]>;
};

const stateKey = "__semiSwingBotTradingRuntime";

function createState(): TradingRuntimeState {
  return {
    auditRecords: [],
    eventIds: new Set<string>(),
    nonces: new Set<string>(),
    paperOrders: [],
    queue: [],
    rateLimits: new Map<string, number[]>(),
  };
}

export function getTradingRuntimeState(): TradingRuntimeState {
  const globalState = globalThis as typeof globalThis & { [stateKey]?: TradingRuntimeState };
  globalState[stateKey] ??= createState();
  return globalState[stateKey];
}

export function resetTradingRuntimeState() {
  const globalState = globalThis as typeof globalThis & { [stateKey]?: TradingRuntimeState };
  globalState[stateKey] = createState();
}

export function recordTradingAlert(record: TradingAlertAuditRecord) {
  const state = getTradingRuntimeState();
  state.auditRecords.unshift(record);
  state.auditRecords = state.auditRecords.slice(0, 250);
}

export function getTradingAlertAuditRecords() {
  return getTradingRuntimeState().auditRecords;
}

export function getQueuedTradingSignals() {
  return getTradingRuntimeState().queue;
}

export function getPaperOrders() {
  return getTradingRuntimeState().paperOrders;
}
