import Link from "next/link";
import { redirect } from "next/navigation";
import { calculateRecoveryMetrics, formatCurrency, getRecoveryData } from "@/lib/recovery/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const stages = ["missed", "contacted", "replied", "booked", "lost"] as const;

function label(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export default async function RecoveryPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const data = await getRecoveryData(user?.id ?? null);
  const metrics = calculateRecoveryMetrics(data.opportunities);
  const rankedByValue = [...metrics.highPriority].sort((a, b) => b.estimated_revenue_pence - a.estimated_revenue_pence);

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">Revenue recovery</h1>
            <p className="mt-2 text-sm text-[#65736f]">
              Missed calls and lost leads tracked by stage, priority, and estimated recovered revenue.
            </p>
          </div>
          <Link href="/calls" className="w-fit rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20332f]">
            Open calls
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Revenue recovered", formatCurrency(metrics.revenueRecovered)],
            ["Monthly projection", formatCurrency(metrics.monthlyProjection)],
            ["Conversion rate", `${metrics.conversionRate}%`],
            ["Left on table", formatCurrency(metrics.moneyLeftOnTable)],
          ].map(([title, value]) => (
            <article key={title} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-[#65736f]">{title}</p>
              <p className="mt-3 text-3xl font-semibold text-[#10201d]">{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">Money left on the table</p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-4xl font-semibold">{formatCurrency(metrics.moneyLeftOnTable)}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Demo estimate from high-intent missed calls and contacted leads that have not booked yet.
              </p>
            </div>
            <Link href="/calls" className="rounded-md bg-[#18b7a0] px-4 py-3 text-sm font-semibold text-[#071311] hover:bg-[#72e5d3]">
              Review missed calls
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          {stages.map((stage) => {
            const items = data.opportunities.filter((item) => item.stage === stage);
            return (
              <article key={stage} className="rounded-lg border border-[#dce6e3] bg-white p-4 shadow-sm">
                <h2 className="font-semibold text-[#10201d]">{label(stage)}</h2>
                <p className="mt-1 text-sm text-[#65736f]">{items.length} leads</p>
                <div className="mt-4 grid gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-3">
                      <p className="text-sm font-semibold text-[#10201d]">Priority {item.priority_score}</p>
                      <p className="mt-1 text-sm text-[#65736f]">{formatCurrency(item.estimated_revenue_pence)}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">High-priority leads</h2>
          <div className="mt-4 grid gap-3">
            {rankedByValue.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[#10201d]">Priority {item.priority_score} recovery lead</p>
                  <p className="mt-1 text-sm text-[#65736f]">{item.next_action ?? "Review lead and decide next action."}</p>
                </div>
                <p className="font-semibold text-[#087968]">{formatCurrency(item.estimated_revenue_pence)}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
