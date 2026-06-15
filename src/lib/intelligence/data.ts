import { anomalyScore, attentionLevel, clinicHealthScore, forecastMissedRevenue } from "@/lib/intelligence/engine";

const health = clinicHealthScore({
  bottlenecks: 3,
  conversion: 74,
  noShowRisk: 28,
  retention: 82,
  revenueRecovery: 78,
});

export const intelligenceDemo = {
  health,
  attention: attentionLevel(health),
  missedRevenueForecast: forecastMissedRevenue(22, 260, 64),
  executiveKpis: [
    { label: "Clinic health", value: String(health), note: "COO score" },
    { label: "Revenue risk", value: "GBP 2.1k", note: "needs attention" },
    { label: "Retention score", value: "82", note: "stable" },
    { label: "Front-desk efficiency", value: "88", note: "top quartile" },
  ],
  morningBriefing: [
    "One high-value treatment opportunity should be handled before routine recall work.",
    "No-show risk is rising for tomorrow morning; confirmation nudges need staff approval.",
    "Front-desk response speed remains a strong conversion advantage this week.",
  ],
  recommendations: [
    { title: "Protect today's revenue", impact: "GBP 950", action: "Prioritise implant consultation callback before 11:30." },
    { title: "Reduce no-show exposure", impact: "GBP 420", action: "Confirm tomorrow morning appointments by 15:00." },
    { title: "Improve treatment acceptance", impact: "GBP 2.4k", action: "Follow up open treatment plan with consult availability." },
  ],
  risks: [
    { label: "Unscheduled treatment follow-up gap", level: "urgent", value: "GBP 2.4k", owner: "Clinical team" },
    { label: "Cancellation trend above baseline", level: "watch", value: `${anomalyScore(9, 6)}%`, owner: "Reception" },
    { label: "Dormant hygiene cohort growing", level: "watch", value: "42 patients", owner: "Practice manager" },
  ],
  funnel: [
    { label: "Enquiries", value: 38 },
    { label: "Qualified", value: 27 },
    { label: "Consults booked", value: 18 },
    { label: "Treatment accepted", value: 11 },
  ],
  staff: [
    { name: "Maya Shah", role: "Admin", efficiency: 92, conversion: "76%", note: "Strong high-value callback handling" },
    { name: "James Carter", role: "Reception", efficiency: 84, conversion: "68%", note: "Needs support during afternoon peaks" },
    { name: "Reception pool", role: "Shared queue", efficiency: 71, conversion: "59%", note: "Bottleneck when approvals stack up" },
  ],
  weeklySummary: [
    "Recovered revenue is up, but treatment acceptance follow-up is the main growth constraint.",
    "Top-performing clinics in the demo benchmark clear replied leads same day.",
    "Operational dependency opportunity: owners should review the morning briefing before opening.",
  ],
  benchmarks: [
    { metric: "Same-day callback rate", clinic: 81, topClinic: 88 },
    { metric: "Treatment acceptance", clinic: 63, topClinic: 72 },
    { metric: "Recall reactivation", clinic: 41, topClinic: 56 },
    { metric: "No-show prevention", clinic: 69, topClinic: 77 },
  ],
};
