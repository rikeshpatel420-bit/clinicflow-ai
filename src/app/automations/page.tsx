import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/workflows/status-pill";
import { workflowDemo } from "@/lib/workflows/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Automation engine</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">State machine and task queue</h1>
            <p className="mt-2 text-sm text-[#65736f]">No execution yet. Demo architecture for retries, scoring, sequencing, and escalations.</p>
          </div>
          <Link href="/notifications" className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white">
            Notifications
          </Link>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {workflowDemo.automations.map((automation) => (
            <article key={automation.id} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#10201d]">{automation.workflowName}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#65736f]">{automation.nextStep}</p>
                </div>
                <StatusPill label={automation.state} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase text-[#65736f]">Lead score</p>
                  <p className="mt-2 text-2xl font-semibold text-[#10201d]">{automation.leadScore}</p>
                </div>
                <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase text-[#65736f]">Probability</p>
                  <p className="mt-2 text-2xl font-semibold text-[#10201d]">{automation.conversionProbability}%</p>
                </div>
                <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase text-[#65736f]">Retries</p>
                  <p className="mt-2 text-2xl font-semibold text-[#10201d]">{automation.retryCount}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Outbound campaign scheduler placeholders</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {workflowDemo.scheduler.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="font-semibold text-[#087968]">{item.label}</p>
                <p className="mt-2 text-sm text-[#65736f]">{item.action}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
