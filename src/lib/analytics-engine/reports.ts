export type ReportSchedule = {
  id: string;
  name: string;
  cadence: "daily" | "weekly" | "monthly";
  audience: "owner" | "manager" | "enterprise";
  exportFormat: "pdf" | "csv" | "dashboard";
  nextRun: string;
};

export const demoReportSchedules: ReportSchedule[] = [
  { id: "report-1", name: "Owner morning briefing", cadence: "daily", audience: "owner", exportFormat: "dashboard", nextRun: "Tomorrow 07:30" },
  { id: "report-2", name: "Weekly revenue intelligence", cadence: "weekly", audience: "manager", exportFormat: "pdf", nextRun: "Monday 08:00" },
  { id: "report-3", name: "Enterprise clinic comparison", cadence: "monthly", audience: "enterprise", exportFormat: "csv", nextRun: "1st of next month" },
];

export function buildReportExportName(report: ReportSchedule) {
  return `${report.name.toLowerCase().replaceAll(" ", "-")}.${report.exportFormat}`;
}

