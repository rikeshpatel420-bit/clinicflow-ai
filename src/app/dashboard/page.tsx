import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DemoKpiBand } from "@/components/dashboard/demo-kpi-band";
import { DashboardMetricCardView } from "@/components/dashboard/metric-card";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { TwilioStatusStrip } from "@/components/dashboard/twilio-status-strip";
import { LeadPipeline } from "@/components/dashboard/lead-pipeline";
import { MissedCallsTable } from "@/components/dashboard/missed-calls-table";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { WorkflowActivityFeed } from "@/components/dashboard/workflow-activity-feed";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteHeader } from "@/components/navigation/site-header";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getClinicDashboardData } from "@/lib/dashboard/live-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getTwilioSetupHealthForClinic, type TwilioSetupHealth } from "@/lib/twilio/health";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function demoStatusMessage(value?: string) {
  if (value === "loaded") return "Demo clinic data loaded for this clinic. Dashboard, patients, and calls now show realistic sample activity.";
  if (value === "already-loaded") return "Demo clinic data is already loaded for this clinic.";
  if (value === "not-authorised") return "Only owner and admin users can load demo data.";
  if (value === "error") return "Demo data could not be loaded. Please check the server logs and try again.";
  return undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  const params = await searchParams;
  let membershipRole: string | null = null;
  let membershipClinicId: string | null = null;
  let twilioHealth: TwilioSetupHealth | null = null;

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  if (isSupabaseConfigured && user) {
    const membership = await getActiveClinicMembershipForUser(user);
    membershipRole = membership?.role ?? null;
    membershipClinicId = membership?.clinic_id ?? null;

    if (!membership) {
      redirect("/onboarding");
    }
  }

  const dashboard = await getClinicDashboardData(user);
  if (membershipClinicId) {
    twilioHealth = await getTwilioSetupHealthForClinic(membershipClinicId);
  }
  const demoKpiBand = dashboard.snapshot
    ? {
        appointmentsBooked: dashboard.snapshot.booked_leads,
        description:
          "This live snapshot uses the current clinic totals already stored in Supabase, so the numbers stay honest while still feeling premium.",
        missedCalls: dashboard.snapshot.missed_calls,
        recoveryRate: dashboard.snapshot.missed_calls > 0 ? Math.round((dashboard.snapshot.booked_leads / dashboard.snapshot.missed_calls) * 100) : 0,
        revenueRecoveredPence: dashboard.snapshot.revenue_recovered_pence,
        sourceLabel: "Latest clinic snapshot",
        title: `Period ${dashboard.snapshot.period_start} to ${dashboard.snapshot.period_end}`,
      }
    : {
        appointmentsBooked: 22,
        description: "Illustrative numbers keep the dashboard feeling active until a live clinic snapshot is available.",
        missedCalls: 47,
        recoveryRate: 91,
        revenueRecoveredPence: 1_425_000,
        sourceLabel: "Demo data mode",
        title: "Premium sample snapshot",
      };
  const clinic = dashboard.clinic ?? {
    id: "unconfigured",
    name: "Clinic dashboard",
    status: "active" as const,
    timezone: "Europe/London",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <SiteHeader activePath="/dashboard" variant="app" />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <DashboardSidebar />

        <section className="min-w-0">
          <MobileDashboardNav />
          <DashboardHeader
            clinic={clinic}
            demoStatus={demoStatusMessage(params?.demo)}
            showDemoDataButton={membershipRole === "owner" || membershipRole === "admin"}
          />

          {twilioHealth ? <TwilioStatusStrip health={twilioHealth} /> : null}

          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="grid min-w-0 gap-6">
              {dashboard.error ? (
                <EmptyState title="Dashboard data unavailable" message={dashboard.error} actionHref="/onboarding" actionLabel="Open onboarding" />
              ) : null}

              <DemoKpiBand
                appointmentsBooked={demoKpiBand.appointmentsBooked}
                description={demoKpiBand.description}
                missedCalls={demoKpiBand.missedCalls}
                recoveryRate={demoKpiBand.recoveryRate}
                revenueRecoveredPence={demoKpiBand.revenueRecoveredPence}
                sourceLabel={demoKpiBand.sourceLabel}
                title={demoKpiBand.title}
              />

              <section aria-label="Overview metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {dashboard.metrics.map((metric) => (
                  <DashboardMetricCardView key={metric.label} metric={metric} />
                ))}
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
