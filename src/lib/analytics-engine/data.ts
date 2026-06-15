import { estimateLifetimeValue, forecastRevenue, predictNoShowRisk } from "@/lib/analytics-engine/forecasting";
import { demoReportSchedules } from "@/lib/analytics-engine/reports";

export const analyticsEngineDemo = {
  executiveKpis: [
    { label: "Forecast revenue", value: `GBP ${forecastRevenue({ baselineRevenue: 42000, conversionLift: 8, noShowReduction: 6, retentionLift: 5 }).toLocaleString("en-GB")}`, note: "next month" },
    { label: "Avg patient LTV", value: `GBP ${estimateLifetimeValue(180, 2.4, 4).toLocaleString("en-GB")}`, note: "demo model" },
    { label: "No-show risk", value: `${predictNoShowRisk({ appointmentLeadDays: 18, confirmationMissing: true, previousNoShows: 1 })}%`, note: "high-risk cohort" },
    { label: "Operational efficiency", value: "84", note: "composite score" },
  ],
  funnel: [
    { label: "Enquiries", value: 48 },
    { label: "Qualified", value: 34 },
    { label: "Booked", value: 22 },
    { label: "Attended", value: 19 },
    { label: "Accepted", value: 12 },
  ],
  trends: [
    { label: "Jan", value: 61 },
    { label: "Feb", value: 66 },
    { label: "Mar", value: 72 },
    { label: "Apr", value: 70 },
    { label: "May", value: 78 },
    { label: "Jun", value: 84 },
  ],
  attribution: [
    { source: "Missed-call recovery", revenue: 18400, bookings: 41 },
    { source: "Reactivation campaigns", revenue: 9600, bookings: 28 },
    { source: "Treatment follow-up", revenue: 14200, bookings: 9 },
  ],
  staffPerformance: [
    { label: "Maya Shah", value: 92 },
    { label: "James Carter", value: 84 },
    { label: "Reception pool", value: 76 },
  ],
  appointmentUtilisation: [
    { label: "Mon", value: 82 },
    { label: "Tue", value: 88 },
    { label: "Wed", value: 79 },
    { label: "Thu", value: 91 },
    { label: "Fri", value: 73 },
  ],
  retentionIndicators: [
    { label: "Active recall base", value: 86 },
    { label: "Dormant risk", value: 31 },
    { label: "Reactivation lift", value: 24 },
    { label: "Churn pressure", value: 18 },
  ],
  benchmarks: [
    { metric: "Conversion", clinic: 74, benchmark: 68 },
    { metric: "Retention", clinic: 82, benchmark: 76 },
    { metric: "No-show prevention", clinic: 69, benchmark: 62 },
    { metric: "Campaign reply rate", clinic: 24, benchmark: 18 },
  ],
  healthScores: [
    { area: "Revenue", score: 86, signal: "strong" },
    { area: "Retention", score: 82, signal: "stable" },
    { area: "Utilisation", score: 77, signal: "watch" },
    { area: "Communication SLA", score: 88, signal: "strong" },
  ],
  reportSchedules: demoReportSchedules,
};
