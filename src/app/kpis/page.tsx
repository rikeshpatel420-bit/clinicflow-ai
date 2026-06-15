import { redirect } from "next/navigation";
import { AnalyticsKpiGrid } from "@/components/analytics-engine/analytics-kpi-grid";
import { AnalyticsShell } from "@/components/analytics-engine/analytics-shell";
import { analyticsEngineDemo } from "@/lib/analytics-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function KpisPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AnalyticsShell
      active="/kpis"
      eyebrow="Executive KPI engine"
      title="Decision-grade KPI layer"
      description="Owner-facing KPI model for revenue forecasting, lifetime value, no-show risk, and operating efficiency."
    >
      <AnalyticsKpiGrid items={analyticsEngineDemo.executiveKpis} />
    </AnalyticsShell>
  );
}

