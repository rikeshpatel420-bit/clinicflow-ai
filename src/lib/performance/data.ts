import { calculateClinicHealth, getRiskLevel, scoreOpportunity } from "@/lib/performance/engine";

const baseMetrics = {
  conversion: 74,
  retention: 82,
  noShowRisk: 31,
  unresolvedRevenue: 6400,
};

export const performanceDemo = {
  healthScore: calculateClinicHealth(baseMetrics),
  executiveKpis: [
    { label: "Recovered revenue", value: "GBP 18.4k", trend: "+14% vs last month" },
    { label: "Booking conversion", value: "74%", trend: "+6 pts" },
    { label: "Patient retention", value: "82%", trend: "+3 pts" },
    { label: "No-show exposure", value: "GBP 3.1k", trend: "down 8%" },
  ],
  scorecards: [
    { area: "Front desk", owner: "Maya Shah", score: 86, metric: "Avg callback 18 min", accountability: "Keep urgent calls under 30 min" },
    { area: "Recovery pipeline", owner: "James Carter", score: 79, metric: "41 booked leads", accountability: "Clear replied leads daily" },
    { area: "Treatment acceptance", owner: "Clinical team", score: 68, metric: "63% accepted", accountability: "Follow up high-value plans" },
    { area: "Reputation", owner: "Reception pool", score: 91, metric: "4.8 review avg", accountability: "Request reviews after positive visits" },
  ],
  opportunities: [
    { label: "Dormant hygiene patients", value: 5200, urgency: 72, likelihood: 68 },
    { label: "Unbooked implant enquiries", value: 9500, urgency: 91, likelihood: 61 },
    { label: "Incomplete treatment plans", value: 7200, urgency: 64, likelihood: 56 },
    { label: "Missed-call callbacks", value: 3100, urgency: 84, likelihood: 74 },
  ].map((item) => ({ ...item, score: scoreOpportunity(item.value, item.urgency, item.likelihood) })),
  bottlenecks: [
    { label: "Callbacks after 16:00", impact: "GBP 2.7k at risk", severity: getRiskLevel(72) },
    { label: "Treatment plans without follow-up", impact: "12 open plans", severity: getRiskLevel(66) },
    { label: "Saturday hygiene demand", impact: "8 waitlist requests", severity: getRiskLevel(48) },
  ],
  trends: [
    { label: "Mon", value: 62 },
    { label: "Tue", value: 69 },
    { label: "Wed", value: 74 },
    { label: "Thu", value: 81 },
    { label: "Fri", value: 78 },
    { label: "Sat", value: 58 },
  ],
  benchmarks: [
    { metric: "Callback speed", clinic: "18 min", benchmark: "32 min", position: "Top quartile" },
    { metric: "Missed-call recovery", clinic: "64%", benchmark: "41%", position: "Above benchmark" },
    { metric: "Treatment acceptance", clinic: "63%", benchmark: "68%", position: "Needs focus" },
    { metric: "Review volume", clinic: "38/month", benchmark: "24/month", position: "Above benchmark" },
  ],
  forecasting: [
    { month: "Jul", recovered: 18400, missed: 6400 },
    { month: "Aug", recovered: 20600, missed: 5700 },
    { month: "Sep", recovered: 23100, missed: 4900 },
    { month: "Oct", recovered: 25800, missed: 4200 },
  ],
  weeklySummary: [
    "Recovered revenue is trending up, but treatment acceptance remains below benchmark.",
    "Front desk speed is now a clear competitive advantage for new patient conversion.",
    "Dormant hygiene reactivation is the strongest near-term retention opportunity.",
  ],
};

