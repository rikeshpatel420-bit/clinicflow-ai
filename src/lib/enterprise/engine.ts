export type EnterpriseRole = "group_owner" | "regional_manager" | "clinic_manager" | "agency_admin" | "viewer";

export function aggregateRevenue(locations: { recoveredRevenue: number }[]) {
  return locations.reduce((total, location) => total + location.recoveredRevenue, 0);
}

export function averageScore(locations: { healthScore: number }[]) {
  if (locations.length === 0) return 0;
  return Math.round(locations.reduce((total, location) => total + location.healthScore, 0) / locations.length);
}

export function canViewRegion(role: EnterpriseRole) {
  return role === "group_owner" || role === "regional_manager" || role === "agency_admin";
}

export function benchmarkPosition(score: number, benchmark: number) {
  if (score >= benchmark + 8) return "leading";
  if (score >= benchmark) return "on track";
  if (score >= benchmark - 8) return "watch";
  return "intervention";
}

