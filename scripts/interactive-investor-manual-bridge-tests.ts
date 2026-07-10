import assert from "node:assert/strict";
import { InteractiveInvestorManualAdapter } from "../src/lib/trading/interactive-investor-manual-adapter";
import { importPortfolioSnapshotCsv, importTransactionHistoryCsv, reconcilePortfolioPositions } from "../src/lib/trading/portfolio-import";
import type { TradingSignal } from "../src/lib/trading/types";

const signal: TradingSignal = {
  action: "BUY",
  barTime: new Date().toISOString(),
  eventId: "manual-test",
  exchange: "NASDAQ",
  mode: "SIGNAL_ONLY",
  price: 172.24,
  quantity: 1,
  receivedAt: new Date().toISOString(),
  strategy: "semi_trend_pullback_v1",
  strategyVersion: "1.0.0",
  ticker: "AMD",
  timeframe: "1D",
  triggeredAt: new Date().toISOString(),
};

const adapter = new InteractiveInvestorManualAdapter();
const ticket = adapter.createProposedOrderTicket(signal, {
  approvedGbpRiskAmount: 500,
  duplicateOrderExists: false,
  existingTickerExposureGbp: 1000,
  gbpUsdRate: { rate: 1.28, updatedAt: new Date().toISOString() },
  highImpactEventWindowActive: false,
  marketSession: "US",
  portfolioValueGbp: 50000,
  quote: { currency: "USD", price: 172.24, pricedAt: new Date().toISOString() },
  semiconductorExposureGbp: 14000,
  signalExpiry: new Date(Date.now() + 3600000).toISOString(),
  signalRationale: "Test rationale",
  stopInvalidationLevel: 163.6,
  target: 189.5,
});

assert.equal(adapter.liveExecutionEnabled, false);
assert.equal(ticket.status, "PROPOSED");
assert.equal(adapter.approveForManualPlacement(ticket).status, "AWAITING_MANUAL_PLACEMENT");

assert.throws(() =>
  adapter.createProposedOrderTicket(signal, {
    approvedGbpRiskAmount: 500,
    existingTickerExposureGbp: 1000,
    marketSession: "CLOSED",
    portfolioValueGbp: 50000,
    quote: { currency: "GBP", price: 172.24, pricedAt: new Date(Date.now() - 3600000).toISOString() },
    semiconductorExposureGbp: 14000,
    signalExpiry: new Date(Date.now() + 3600000).toISOString(),
    signalRationale: "Test rationale",
    stopInvalidationLevel: 163.6,
    target: 189.5,
  }),
);

const portfolioImport = importPortfolioSnapshotCsv(
  "Account,Ticker,ISIN,Exchange,Quantity,Book Cost,Currency\nISA-001,AMD,US0079031078,NASDAQ,3,410.25,USD",
  { accountIdentifier: "Account", ticker: "Ticker", isin: "ISIN", exchange: "Exchange", quantity: "Quantity", bookCost: "Book Cost", currency: "Currency" },
);
assert.equal(portfolioImport.errors.length, 0);

const transactionImport = importTransactionHistoryCsv(
  "Account,Transaction ID,Ticker,ISIN,Exchange,Quantity,Price,Currency,Transaction Date,Settlement Date,Fees\nISA-001,T1,AMD,US0079031078,NASDAQ,1,172.24,USD,2026-07-10,2026-07-12,3.99\nISA-001,T1,AMD,US0079031078,NASDAQ,1,172.24,USD,2026-07-10,2026-07-12,3.99",
  {
    accountIdentifier: "Account",
    currency: "Currency",
    exchange: "Exchange",
    fees: "Fees",
    isin: "ISIN",
    price: "Price",
    quantity: "Quantity",
    settlementDate: "Settlement Date",
    ticker: "Ticker",
    transactionDate: "Transaction Date",
    transactionId: "Transaction ID",
  },
);
assert.deepEqual(transactionImport.duplicateTransactionIds, ["T1"]);

const reconciliation = reconcilePortfolioPositions(
  [{ accountIdentifier: "ISA-001", bookCost: 400, currency: "USD", exchange: "NASDAQ", isin: "US0079031078", quantity: 2, ticker: "AMD" }],
  portfolioImport.rows,
  ["T1"],
);
assert.equal(reconciliation[0].quantityDifference, 1);

console.log("Interactive Investor manual bridge tests passed.");
