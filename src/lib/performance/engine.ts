export type RiskLevel = "low" | "medium" | "high" | "critical";

export function calculateClinicHealth({
  conversion,
  retention,
  noShowRisk,
  unresolvedRevenue,
}: {
  conversion: number;
  retention: number;
  noShowRisk: number;
  unresolvedRevenue: number;
}) {
  const revenuePenalty = Math.min(18, Math.floor(unresolvedRevenue / 500));
  return Math.max(0, Math.round((conversion + retention) / 2 - noShowRisk * 0.35 - revenuePenalty));
}

export function getRiskLevel(value: number): RiskLevel {
  if (value >= 85) return "critical";
  if (value >= 65) return "high";
  if (value >= 40) return "medium";
  return "low";
}

export function scoreOpportunity(value: number, urgency: number, likelihood: number) {
  return Math.min(100, Math.round(value / 25 + urgency * 0.35 + likelihood * 0.35));
}

