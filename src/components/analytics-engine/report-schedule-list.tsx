import { buildReportExportName, type ReportSchedule } from "@/lib/analytics-engine/reports";

export function ReportScheduleList({ reports }: { reports: ReportSchedule[] }) {
  return (
    <div className="grid gap-3">
      {reports.map((report) => (
        <article key={report.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#10201d]">{report.name}</p>
              <p className="mt-1 text-sm text-[#65736f]">{report.cadence} / {report.audience} / {buildReportExportName(report)}</p>
            </div>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">{report.nextRun}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

