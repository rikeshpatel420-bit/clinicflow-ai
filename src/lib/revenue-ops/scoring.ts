export type OpportunityStage = "new" | "prioritised" | "contacted" | "accepted" | "recovered" | "lost";
export type AutomationCadence = "same_day" | "next_day" | "weekly" | "monthly";

export function scoreRevenueOpportunity({
  value,
  urgency,
  intent,
  lastContactDays,
}: {
  value: number;
  urgency: number;
  intent: number;
  lastContactDays: number;
}) {
  const recencyPenalty = Math.min(25, lastContactDays * 2);
  return Math.max(0, Math.min(100, Math.round(value / 100 + urgency * 0.35 + intent * 0.45 - recencyPenalty)));
}

export function getRecommendedCadence(score: number): AutomationCadence {
  if (score >= 85) return "same_day";
  if (score >= 70) return "next_day";
  if (score >= 45) return "weekly";
  return "monthly";
}

export function forecastRecoveredRevenue(opportunities: { value: number; score: number }[]) {
  return opportunities.reduce((total, item) => total + Math.round(item.value * (item.score / 100) * 0.42), 0);
}

