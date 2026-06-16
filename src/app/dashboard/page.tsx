import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMetricCardView } from "@/components/dashboard/metric-card";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LeadPipeline } from "@/components/dashboard/lead-pipeline";
import { MissedCallsTable } from "@/components/dashboard/missed-calls-table";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { WorkflowActivityFeed } from "@/components/dashboard/workflow-activity-feed";
import { EmptyState } from "@/components/ui/empty-state";
import { getActiveClinicMembership } from "@/lib/auth/clinic-workspace";
import { getClinicDashboardData } from "@/lib/dashboard/live-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  if (isSupabaseConfigured && user) {
    const membership = await getActiveClinicMembership(user.id);

    if (!membership) {
      redirect("/onboarding");
    }
  }

  const dashboard = await getClinicDashboardData(user?.id ?? null);
  const clinic = dashboard.clinic ?? {
    id: "unconfigured",
    name: "Clinic dashboard",
    status: "active" as const,
    timezone: "Europe/London",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <DashboardSidebar />

        <section className="min-w-0">
          <MobileDashboardNav />
          <DashboardHeader clinic={clinic} />

          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="grid min-w-0 gap-6">
              {dashboard.error ? (
                <EmptyState title="Dashboard data unavailable" message={dashboard.error} actionHref="/onboarding" actionLabel="Open onboarding" />
              ) : null}

              <section aria-label="Overview metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.metrics.map((metric) => (
                  <DashboardMetricCardView key={metric.label} metric={metric} />
                ))}
              </section>

              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Dashboard metrics model</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Low-cost operational snapshot
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    This panel reads from `dashboard_metric_snapshots`. If no scheduled aggregation has run yet, the cards show zero
                    values and the operational tables below show empty states.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">period</p>
                  <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                    {dashboard.snapshot ? `${dashboard.snapshot.period_start} to ${dashboard.snapshot.period_end}` : "No snapshot"}
                  </p>
                </div>
              </section>

              <MissedCallsTable rows={dashboard.missedCalls} />
              <LeadPipeline columns={dashboard.leadColumns} />
            </div>

            <aside className="grid content-start gap-6">
              <WorkflowActivityFeed items={dashboard.activity} />

              <section className="rounded-lg bg-slate-950 p-5 text-white shadow-sm dark:bg-white dark:text-slate-950">
                <p className="text-sm font-semibold text-teal-300 dark:text-teal-700">Auth boundary</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Ready for clinic-scoped data</h2>
                <p className="mt-3 text-sm leading-6 text-white/70 dark:text-slate-600">
                  This route requires an authenticated user when Supabase is configured. Provider events stay read-only here and should
                  enter the system through RLS-backed server actions or signed webhooks.
                </p>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
