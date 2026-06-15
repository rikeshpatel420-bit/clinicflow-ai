import { calculateRecoveryMetrics, demoRecoveryOpportunities, formatCurrency } from "@/lib/recovery/data";

const recovery = calculateRecoveryMetrics(demoRecoveryOpportunities);

export const analyticsDemo = {
  appointmentFunnel: [
    { label: "Missed calls", value: 80 },
    { label: "Contacted", value: 52 },
    { label: "Replied", value: 34 },
    { label: "Booked", value: 18 },
  ],
  attribution: [
    { channel: "Missed call recovery", revenue: 12600, share: "62%" },
    { channel: "Recall campaigns", revenue: 4200, share: "21%" },
    { channel: "Manual follow-up", revenue: 3500, share: "17%" },
  ],
  clinicGrowthInsights: [
    "Recovery speed is the strongest revenue lever this month.",
    "Saturday missed calls are converting at a higher booking value.",
    "Hygiene recall campaigns can lift predictable recurring revenue.",
  ],
  locations: [
    { name: "Central", recovered: 8400, conversion: "31%" },
    { name: "North", recovered: 5100, conversion: "24%" },
    { name: "West", recovered: 6800, conversion: "28%" },
  ],
  missedRevenueTrend: [
    { month: "Jan", missed: 9200, recovered: 4100 },
    { month: "Feb", missed: 8700, recovered: 5300 },
    { month: "Mar", missed: 7600, recovered: 6100 },
    { month: "Apr", missed: 6900, recovered: 7200 },
  ],
  patientLifetimeValue: {
    average: 1240,
    recoveredLeadLtv: 18600,
    repeatBookingRate: "38%",
  },
  recovery,
  staffPerformance: [
    { name: "Front desk", responseTime: "6m", recovered: 9, conversion: "33%" },
    { name: "Reception lead", responseTime: "4m", recovered: 6, conversion: "41%" },
    { name: "Practice manager", responseTime: "12m", recovered: 3, conversion: "22%" },
  ],
  topSources: [
    { source: "Google Business Profile", missed: 28, value: 9800 },
    { source: "Website mobile click-to-call", missed: 21, value: 7350 },
    { source: "Referral calls", missed: 12, value: 5400 },
  ],
};

export function formatAnalyticsCurrency(value: number) {
  return formatCurrency(value * 100);
}
