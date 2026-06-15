import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/workflows/status-pill";
import { workflowDemo } from "@/lib/workflows/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-8 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Notification center</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">Clinic action queue</h1>
            <p className="mt-2 text-sm text-[#65736f]">Staff-facing alerts for escalations, approvals, and workflow health.</p>
          </div>
          <Link href="/workflows" className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white">
            Workflows
          </Link>
        </header>

        <section className="grid gap-4">
          {workflowDemo.notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#10201d]">{notification.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#65736f]">{notification.body}</p>
                </div>
                <div className="flex gap-2">
                  <StatusPill label={notification.priority} />
                  <StatusPill label={notification.status} />
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
