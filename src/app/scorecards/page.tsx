import { redirect } from "next/navigation";
import { PerformanceShell } from "@/components/performance/performance-shell";
import { performanceDemo } from "@/lib/performance/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ScorecardsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PerformanceShell
      active="/scorecards"
      eyebrow="Daily scorecards"
      title="Staff accountability system"
      description="Role-level scorecards for front desk, recovery, treatment acceptance, and reputation performance."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {performanceDemo.scorecards.map((card) => (
          <article key={card.area} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#087968]">{card.owner}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{card.area}</h2>
              </div>
              <span className="rounded-md bg-[#10201d] px-3 py-1.5 text-sm font-semibold text-white">{card.score}</span>
            </div>
            <p className="mt-4 text-sm text-[#65736f]">{card.metric}</p>
            <p className="mt-3 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{card.accountability}</p>
          </article>
        ))}
      </section>
    </PerformanceShell>
  );
}

