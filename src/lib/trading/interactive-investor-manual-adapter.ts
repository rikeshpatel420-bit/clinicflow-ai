import crypto from "node:crypto";
import type { ManualExecutionDetails, ManualOrderTicket, TradingSignal } from "@/lib/trading/types";

type Quote = {
  price: number;
  pricedAt: string;
  currency: "GBP" | "USD";
};

type RiskContext = {
  approvedGbpRiskAmount: number;
  portfolioValueGbp: number;
  existingTickerExposureGbp: number;
  semiconductorExposureGbp: number;
  quote: Quote;
  gbpUsdRate?: { rate: number; updatedAt: string };
  stopInvalidationLevel: number;
  target: number;
  signalRationale: string;
  signalExpiry: string;
  shutdownActive?: boolean;
  duplicateOrderExists?: boolean;
  highImpactEventWindowActive?: boolean;
  marketSession: "LONDON" | "US" | "CLOSED";
};

const instrumentMap = {
  SMGB: { name: "VanEck Semiconductor UCITS ETF", exchange: "LSE", iiTicker: "SMGB" },
  SMH: { name: "VanEck Semiconductor ETF", exchange: "NASDAQ", iiTicker: "SMH" },
  SOXX: { name: "iShares Semiconductor ETF", exchange: "NASDAQ", iiTicker: "SOXX" },
  MU: { name: "Micron Technology Inc", exchange: "NASDAQ", iiTicker: "MU" },
  AMD: { name: "Advanced Micro Devices Inc", exchange: "NASDAQ", iiTicker: "AMD" },
  NVDA: { name: "NVIDIA Corp", exchange: "NASDAQ", iiTicker: "NVDA" },
  AVGO: { name: "Broadcom Inc", exchange: "NASDAQ", iiTicker: "AVGO" },
  TSM: { name: "Taiwan Semiconductor Manufacturing Co ADR", exchange: "NYSE", iiTicker: "TSM" },
  ASML: { name: "ASML Holding NV ADR", exchange: "NASDAQ", iiTicker: "ASML" },
} satisfies Record<TradingSignal["ticker"], { name: string; exchange: string; iiTicker: string }>;

function hoursOld(value: string) {
  return (Date.now() - new Date(value).getTime()) / 3_600_000;
}

function assertRiskChecks(signal: TradingSignal, context: RiskContext) {
  const failures: string[] = [];
  const expiry = new Date(context.signalExpiry);
  const quoteAgeHours = hoursOld(context.quote.pricedAt);
  const fxAgeHours = context.gbpUsdRate ? hoursOld(context.gbpUsdRate.updatedAt) : 0;
  const proposedExposure = context.existingTickerExposureGbp + context.approvedGbpRiskAmount;
  const totalSemiconductorExposure = context.semiconductorExposureGbp + context.approvedGbpRiskAmount;
  const riskPercentage = context.approvedGbpRiskAmount / Math.max(context.portfolioValueGbp, 1);

  if (expiry.getTime() <= Date.now()) failures.push("Signal has expired.");
  if (quoteAgeHours > 0.25) failures.push("Quote is stale.");
  if (context.marketSession === "CLOSED") failures.push("No appropriate London or US market session is open.");
  if (proposedExposure / context.portfolioValueGbp > 0.15) failures.push("Position limit would be breached.");
  if (totalSemiconductorExposure / context.portfolioValueGbp > 0.45) failures.push("Semiconductor exposure limit would be breached.");
  if (riskPercentage > 0.02) failures.push("Portfolio risk limit would be breached.");
  if (context.shutdownActive) failures.push("Daily or weekly shutdown is active.");
  if (context.duplicateOrderExists) failures.push("A duplicate order already exists.");
  if (context.highImpactEventWindowActive) failures.push("A prohibited high-impact event window is active.");
  if (context.quote.currency === "USD" && (!context.gbpUsdRate || fxAgeHours > 1)) failures.push("GBP/USD conversion is not current.");
  if (signal.action === "HOLD") failures.push("HOLD signals cannot create manual order tickets.");

  if (failures.length) {
    throw new Error(`Manual order proposal blocked: ${failures.join(" ")}`);
  }
}

export class InteractiveInvestorManualAdapter {
  readonly liveExecutionEnabled = false;

  createProposedOrderTicket(signal: TradingSignal, context: RiskContext): ManualOrderTicket {
    assertRiskChecks(signal, context);

    const instrument = instrumentMap[signal.ticker];
    const exchange = instrument.exchange;
    const fxRate = context.quote.currency === "USD" ? context.gbpUsdRate?.rate ?? 1 : 1;
    const gbpPrice = context.quote.currency === "USD" ? context.quote.price / fxRate : context.quote.price;
    const calculatedQuantity = Math.max(1, Math.floor(context.approvedGbpRiskAmount / gbpPrice));
    const suggestedLimitPrice = signal.action === "BUY" ? context.quote.price * 1.0025 : context.quote.price * 0.9975;
    const estimatedConsideration = calculatedQuantity * gbpPrice;
    const estimatedCharges = Math.max(3.99, estimatedConsideration * 0.001);
    const riskPercentage = context.approvedGbpRiskAmount / Math.max(context.portfolioValueGbp, 1);
    const action = signal.action === "SELL" ? "SELL" : signal.action === "REDUCE" ? "REDUCE" : "BUY";
    const summary = [
      `Interactive Investor manual order only`,
      `${action} ${calculatedQuantity} ${instrument.iiTicker}`,
      `${instrument.name} on ${exchange}`,
      `Suggested limit: ${suggestedLimitPrice.toFixed(2)} ${context.quote.currency}`,
      `Stop/invalidation: ${context.stopInvalidationLevel.toFixed(2)}`,
      `Target: ${context.target.toFixed(2)}`,
      `Expires: ${context.signalExpiry}`,
    ].join("\n");

    return {
      action,
      approvedGbpRiskAmount: context.approvedGbpRiskAmount,
      calculatedQuantity,
      copyableOrderSummary: summary,
      createdAt: new Date().toISOString(),
      estimatedCharges: Number(estimatedCharges.toFixed(2)),
      estimatedConsideration: Number(estimatedConsideration.toFixed(2)),
      exchange,
      id: crypto.randomUUID(),
      instrumentName: instrument.name,
      interactiveInvestorTicker: instrument.iiTicker,
      latestKnownPrice: context.quote.price,
      latestKnownPriceAt: context.quote.pricedAt,
      quoteStale: hoursOld(context.quote.pricedAt) > 0.25,
      recommendedOrderType: "LIMIT",
      riskPercentage: Number((riskPercentage * 100).toFixed(2)),
      signalExpiry: context.signalExpiry,
      signalRationale: context.signalRationale,
      sourceEventId: signal.eventId,
      status: "PROPOSED",
      stopInvalidationLevel: context.stopInvalidationLevel,
      suggestedLimitPrice: Number(suggestedLimitPrice.toFixed(2)),
      target: context.target,
      ticker: signal.ticker,
    };
  }

  approveForManualPlacement(ticket: ManualOrderTicket): ManualOrderTicket {
    return {
      ...ticket,
      status: "AWAITING_MANUAL_PLACEMENT",
    };
  }

  recordManualExecution(ticket: ManualOrderTicket, execution: ManualExecutionDetails): ManualOrderTicket {
    return {
      ...ticket,
      execution,
      status: execution.quantityFilled >= ticket.calculatedQuantity ? "FILLED" : "PARTIALLY_FILLED",
    };
  }
}
