export type AttentionLevel = "normal" | "watch" | "urgent" | "critical";

export function clinicHealthScore({
  revenueRecovery,
  retention,
  conversion,
  noShowRisk,
  bottlenecks,
}: {
  revenueRecovery: number;
  retention: number;
  conversion: number;
  noShowRisk: number;
  bottlenecks: number;
}) {
  return Math.max(0, Math.round((revenueRecovery + retention + conversion) / 3 - noShowRisk * 0.25 - bottlenecks * 4));
}

export function attentionLevel(score: number): AttentionLevel {
  if (score < 45) return "critical";
  if (score < 65) return "urgent";
  if (score < 80) return "watch";
  return "normal";
}

export function forecastMissedRevenue(openLeads: number, averageValue: number, recoveryRate: number) {
  return Math.round(openLeads * averageValue * (1 - recoveryRate / 100));
}

export function anomalyScore(current: number, baseline: number) {
  if (baseline === 0) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
}

