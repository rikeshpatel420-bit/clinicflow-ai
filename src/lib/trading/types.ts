export const allowedTradingTickers = ["SMGB", "SMH", "SOXX", "MU", "AMD", "NVDA", "AVGO", "TSM", "ASML"] as const;

export type TradingTicker = (typeof allowedTradingTickers)[number];
export type TradingMode = "PAPER" | "SIGNAL_ONLY";
export type TradingAction = "BUY" | "SELL" | "REDUCE" | "HOLD";

export type TradingViewWebhookPayload = {
  secret?: unknown;
  event_id?: unknown;
  strategy?: unknown;
  strategy_version?: unknown;
  ticker?: unknown;
  exchange?: unknown;
  timeframe?: unknown;
  action?: unknown;
  price?: unknown;
  quantity?: unknown;
  bar_time?: unknown;
  triggered_at?: unknown;
  mode?: unknown;
};

export type TradingSignal = {
  eventId: string;
  strategy: string;
  strategyVersion: string;
  ticker: TradingTicker;
  exchange: string;
  timeframe: string;
  action: TradingAction;
  price: number;
  quantity: number;
  barTime: string;
  triggeredAt: string;
  mode: TradingMode;
  receivedAt: string;
};

export type WebhookDecision = "ACCEPTED" | "REJECTED";

export type TradingAlertAuditRecord = {
  id: string;
  decision: WebhookDecision;
  reason: string;
  eventId?: string;
  ticker?: string;
  action?: string;
  strategy?: string;
  strategyVersion?: string;
  receivedAt: string;
  triggeredAt?: string;
  remoteKey: string;
};

export type QueuedTradingSignal = {
  id: string;
  signal: TradingSignal;
  queuedAt: string;
  status: "QUEUED" | "PROCESSED" | "FAILED";
  result?: string;
};

export type PaperOrder = {
  id: string;
  eventId: string;
  ticker: TradingTicker;
  exchange: string;
  action: Exclude<TradingAction, "HOLD">;
  quantity: number;
  price: number;
  consideration: number;
  mode: "PAPER";
  status: "SIMULATED";
  createdAt: string;
};

export type ManualOrderStatus =
  | "PROPOSED"
  | "APPROVED_FOR_MANUAL_PLACEMENT"
  | "AWAITING_MANUAL_PLACEMENT"
  | "MANUALLY_PLACED"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export type ManualExecutionDetails = {
  iiOrderReference: string;
  executionTimestamp: string;
  quantityFilled: number;
  averageExecutionPrice: number;
  commission: number;
  stampDuty?: number;
  fxCharge?: number;
  settlementCurrency: string;
  notes?: string;
};

export type ManualOrderTicket = {
  id: string;
  sourceEventId: string;
  status: ManualOrderStatus;
  instrumentName: string;
  ticker: TradingTicker;
  exchange: string;
  interactiveInvestorTicker: string;
  action: "BUY" | "SELL" | "REDUCE";
  approvedGbpRiskAmount: number;
  calculatedQuantity: number;
  latestKnownPrice: number;
  latestKnownPriceAt: string;
  quoteStale: boolean;
  recommendedOrderType: "MARKET" | "LIMIT";
  suggestedLimitPrice: number;
  estimatedConsideration: number;
  estimatedCharges: number;
  riskPercentage: number;
  stopInvalidationLevel: number;
  target: number;
  signalRationale: string;
  signalExpiry: string;
  copyableOrderSummary: string;
  createdAt: string;
  execution?: ManualExecutionDetails;
};

export type PortfolioSnapshotRow = {
  accountIdentifier: string;
  ticker: string;
  isin: string;
  exchange: string;
  quantity: number;
  bookCost: number;
  currency: string;
};

export type TransactionHistoryRow = {
  accountIdentifier: string;
  transactionId: string;
  ticker: string;
  isin: string;
  exchange: string;
  quantity: number;
  price: number;
  currency: string;
  transactionDate: string;
  settlementDate: string;
  fees: number;
};

export type ImportValidationResult<T> = {
  rows: T[];
  errors: string[];
  duplicateTransactionIds: string[];
};

export type ReconciliationRow = {
  ticker: string;
  botQuantity: number;
  importedQuantity: number;
  quantityDifference: number;
  botCostBasis: number;
  importedCostBasis: number;
  costBasisDifference: number;
  unresolvedTransactions: string[];
};
