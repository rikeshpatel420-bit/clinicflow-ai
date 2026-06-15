export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type SlaStatus = "within_sla" | "at_risk" | "breached";

export function getSlaStatus(minutesWaiting: number, targetMinutes: number): SlaStatus {
  if (minutesWaiting > targetMinutes) return "breached";
  if (minutesWaiting >= targetMinutes * 0.75) return "at_risk";
  return "within_sla";
}

export function getSeverity(minutesWaiting: number, valueAtRisk: number): AlertSeverity {
  if (minutesWaiting > 45 || valueAtRisk >= 500) return "critical";
  if (minutesWaiting > 25 || valueAtRisk >= 300) return "high";
  if (minutesWaiting > 10 || valueAtRisk >= 150) return "medium";
  return "low";
}

export function calculateHealthScore({
  breached,
  unresolved,
  workloadImbalance,
}: {
  breached: number;
  unresolved: number;
  workloadImbalance: number;
}) {
  return Math.max(0, 100 - breached * 12 - unresolved * 3 - workloadImbalance * 5);
}

