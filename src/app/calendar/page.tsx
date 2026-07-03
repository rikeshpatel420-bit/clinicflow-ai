import Link from "next/link";
import { redirect } from "next/navigation";
import { AppointmentsPanel } from "@/components/dashboard/appointments-panel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { SiteHeader } from "@/components/navigation/site-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getClinicDashboardData } from "@/lib/dashboard/live-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusMessage(value?: string) {
  if (value === "confirmed") return "The booking request was confirmed and the calendar was updated.";
  if (value === "contacted") return "The booking request was marked as contacted.";
  if (value === "cancelled") return "The appointment was cancelled.";
  if (value === "reschedule-needed") return "The appointment now needs a reschedule.";
  if (value === "slot-unavailable") return "No confirmed slot was available, so the request remains pending.";
  if (value === "already-confirmed") return "This request was already confirmed.";
  if (value === "not-authorised") return "Only clinic owners and admins can update the calendar.";
  if (value === "confirm-error") return "The appointment could not be confirmed. Please check the logs and try again.";
  return undefined;
}

function isToday(value: string) {
  const now = new Date();
  const date = new Date(value);
  return now.getUTCFullYear() === date.getUTCFullYear() && now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() === date.getUTCDate();
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  const params = await searchParams;

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const membership = isSupabaseConfigured && user ? await getActiveClinicMembershipForUser(user) : null;
  if (isSupabaseConfigured && user && !membership) {
    redirect("/onboarding");
  }

  const dashboard = await getClinicDashboardData(user);
  const nowIso = new Date().toISOString();
  const confirmedAppointments = dashboard.appointments.filter((appointment) => appointment.status === "confirmed");
  const pendingRequests = dashboard.bookingRequests.filter((request) => request.status === "requested");
  const todayCount = confirmedAppointments.filter((appointment) => isToday(appointment.appointment_start)).length;
  const upcomingCount = confirmedAppointments.filter((appointment) => appointment.appointment_start > nowIso).length;
  const urgentCount = pendingRequests.filter((request) => /emergency|urgent|same day|pain|swelling|bleeding/i.test(`${request.booking_type} ${request.next_step ?? ""} ${request.notes ?? ""}`)).length +
    dashboard.appointments.filter((appointment) => /emergency|urgent|same day|pain|swelling|bleeding/i.test(`${appointment.treatment_type} ${appointment.notes ?? ""}`)).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <SiteHeader activePath="/calendar" variant="app" />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <DashboardSidebar activePath="/calendar" />

        <section className="min-w-0">
          <MobileDashboardNav />
          <DashboardHeader
            clinic={dashboard.clinic ?? { id: "unconfigured", name: "Clinic dashboard", status: "active", timezone: "Europe/London" }}
            demoStatus={statusMessage(params?.status)}
            showDemoDataButton={false}
          />

          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="grid gap-6">
              {dashboard.error ? (
                <EmptyState title="Calendar data unavailable" message={dashboard.error} actionHref="/dashboard" actionLabel="Back to dashboard" />
              ) : null}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Today", value: todayCount },
                  { label: "Upcoming", value: upcomingCount },
                  { label: "Pending requests", value: pendingRequests.length },
                  { label: "Urgent", value: urgentCount },
                ].map((card) => (
                  <article key={card.label} className="rounded-[24px] border border-[#dbe6e2] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-medium text-[#65736f] dark:text-slate-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-[#10201d] dark:text-white">{card.value}</p>
                  </article>
                ))}
              </section>

              <AppointmentsPanel appointments={dashboard.appointments} bookingRequests={dashboard.bookingRequests} />
            </div>

            <aside className="grid content-start gap-6">
              <section className="rounded-[28px] border border-[#dbe6e2] bg-[#10201d] p-5 text-white shadow-[0_24px_100px_rgba(16,33,29,0.14)]">
                <p className="text-sm font-semibold text-teal-300 dark:text-teal-700">Calendar view</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Today and upcoming bookings</h2>
                <p className="mt-3 text-sm leading-6 text-white/70 dark:text-slate-600">
                  Use this page to confirm requests, cancel bookings, and keep an eye on urgent follow-up items without leaving the app.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link href="/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-white backdrop-blur hover:bg-white/15">
                    Dashboard
                  </Link>
                  <Link href="/calls" className="rounded-full bg-teal-400 px-4 py-2.5 text-center text-sm font-semibold text-[#071311] hover:bg-teal-300">
                    Calls
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
