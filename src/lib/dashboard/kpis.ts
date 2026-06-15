import type { CallPlaceholder } from "./data";
import type { Patient } from "@/types/database";

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: string;
};

export function calculateDashboardKpis(input: { calls: CallPlaceholder[]; patients: Patient[] }): DashboardMetric[] {
  const recoveredBookings = input.calls.length > 0 ? 1 : 0;
  const revenueRecovered = recoveredBookings * 350;
  const conversionRate = input.calls.length ? Math.round((recoveredBookings / input.calls.length) * 100) : 0;

  return [
    { label: "Missed calls", value: String(input.calls.length), change: "placeholder model", tone: "text-[#d97706]" },
    { label: "Revenue recovered", value: `GBP ${revenueRecovered}`, change: "demo impact", tone: "text-[#087968]" },
    { label: "Conversion rate", value: `${conversionRate}%`, change: "missed to booked", tone: "text-[#2563eb]" },
    { label: "Open leads", value: String(input.patients.length), change: "clinic scoped", tone: "text-[#6d28d9]" },
  ];
}
