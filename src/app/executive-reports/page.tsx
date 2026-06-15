import { redirect } from "next/navigation";
import { AnalyticsShell } from "@/components/analytics-engine/analytics-shell";
import { ReportScheduleList } from "@/components/analytics-engine/report-schedule-list";
import { analyticsEngineDemo } from "@/lib/analytics-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExecutiveReportsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AnalyticsShell
      active="/executive-reports"
      eyebrow="Report generation"
      title="Executive report scheduling"
      description="Demo report generation architecture for daily, weekly, and monthly owner or enterprise reporting."
    >
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <ReportScheduleList reports={analyticsEngineDemo.reportSchedules} />
      </section>
    </AnalyticsShell>
  );
}

