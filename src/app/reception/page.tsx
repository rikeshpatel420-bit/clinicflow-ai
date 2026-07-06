import { redirect } from "next/navigation";
import { MobileDashboardNav } from "@/components/dashboard/mobile-dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SiteHeader } from "@/components/navigation/site-header";
import { ReceptionWorkspace } from "@/components/reception/reception-workspace";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { getReceptionConsoleData } from "@/lib/reception/data";

export const dynamic = "force-dynamic";

function statusMessage(value?: string) {
  if (value === "confirmed") return "The booking request was confirmed and the calendar was updated.";
  if (value === "contacted") return "The item was marked as contacted.";
  if (value === "lost") return "The item was marked as lost.";
  if (value === "reschedule-needed") return "The appointment now needs a reschedule.";
  if (value === "sms-sent") return "The simulation SMS was logged to the audit trail.";
  if (value === "slot-unavailable") return "No confirmed slot was available, so the request remains pending.";
  if (value === "already-confirmed") return "This request was already confirmed.";
  if (value === "not-authorised") return "Only clinic owners and admins can update reception items.";
  if (value === "confirm-error") return "The appointment could not be confirmed. Please check the logs and try again.";
  if (value === "sms-error") return "The simulation SMS could not be saved.";
  return undefined;
}

export default async function ReceptionPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  const params = await searchParams;

  if (isSupabaseConfigured && !user) {
    redirect("/login?next=/reception");
  }

  let membership = null;
  if (isSupabaseConfigured && user) {
    membership = await getActiveClinicMembershipForUser(user);
    if (!membership) {
      redirect("/onboarding");
    }
  }

  const data = await getReceptionConsoleData(user);
  const notice = statusMessage(params?.status);

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/reception" variant="app" />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <DashboardSidebar activePath="/reception" />

        <section className="min-w-0">
          <MobileDashboardNav />
          <ReceptionWorkspace data={data} />
          {notice ? (
            <div className="px-4 pb-6 sm:px-6 xl:px-8">
              <div className="rounded-[20px] border border-[#c8eee6] bg-[#f6fffc] px-4 py-3 text-sm font-medium text-[#087968]">
                {notice}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
