import { redirect } from "next/navigation";
import { CommunicationShell } from "@/components/communications/communication-shell";
import { engagementDemo } from "@/lib/communications/engagement-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <CommunicationShell
      active="/reminders"
      eyebrow="Appointment reminder system"
      title="Reminder and no-show prevention"
      description="Demo reminder architecture for appointment confirmations, no-show risk, and staff-reviewed patient nudges."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {engagementDemo.reminders.map((reminder) => (
          <article key={reminder.id} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#10201d]">{reminder.patient}</h2>
              <span className="rounded-md bg-[#fef9c3] px-2.5 py-1 text-xs font-semibold text-[#854d0e]">{reminder.risk}</span>
            </div>
            <p className="mt-3 text-sm text-[#65736f]">{reminder.appointment}</p>
            <p className="mt-4 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm text-[#394642]">{reminder.action}</p>
          </article>
        ))}
      </section>
    </CommunicationShell>
  );
}

