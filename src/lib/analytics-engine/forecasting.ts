export type ForecastInput = {
  baselineRevenue: number;
  conversionLift: number;
  retentionLift: number;
  noShowReduction: number;
};

export function forecastRevenue(input: ForecastInput) {
  const conversionImpact = input.baselineRevenue * (input.conversionLift / 100);
  const retentionImpact = input.baselineRevenue * (input.retentionLift / 100);
  const noShowImpact = input.baselineRevenue * (input.noShowReduction / 100) * 0.4;
  return Math.round(input.baselineRevenue + conversionImpact + retentionImpact + noShowImpact);
}

export function estimateLifetimeValue(averageVisitValue: number, visitsPerYear: number, retentionYears: number) {
  return Math.round(averageVisitValue * visitsPerYear * retentionYears);
}

export function predictNoShowRisk({ previousNoShows, confirmationMissing, appointmentLeadDays }: { previousNoShows: number; confirmationMissing: boolean; appointmentLeadDays: number }) {
  return Math.min(100, previousNoShows * 22 + (confirmationMissing ? 28 : 0) + Math.max(0, appointmentLeadDays - 14));
}

