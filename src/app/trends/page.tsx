import { redirect } from "next/navigation";
import { AnalyticsShell } from "@/components/analytics-engine/analytics-shell";
import { ChartBlock } from "@/components/analytics-engine/chart-block";
import { analyticsEngineDemo } from "@/lib/analytics-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AnalyticsShell
      active="/trends"
      eyebrow="Trend monitoring"
      title="Clinic trend analysis"
      description="Trend abstraction for revenue, conversion, utilisation, retention, and operational efficiency signals."
    >
      <ChartBlock title="Monthly operating trend" items={analyticsEngineDemo.trends} />
    </AnalyticsShell>
  );
}

