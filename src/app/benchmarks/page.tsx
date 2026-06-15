import { redirect } from "next/navigation";
import { PerformanceShell } from "@/components/performance/performance-shell";
import { performanceDemo } from "@/lib/performance/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PerformanceShell
      active="/benchmarks"
      eyebrow="Benchmark comparisons"
      title="Clinic performance against operating targets"
      description="Demo benchmark table for owners to spot competitive advantages and weak points quickly."
    >
      <section className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#f7faf9] text-[#65736f]">
            <tr>
              <th className="px-5 py-3 font-semibold">Metric</th>
              <th className="px-5 py-3 font-semibold">Clinic</th>
              <th className="px-5 py-3 font-semibold">Benchmark</th>
              <th className="px-5 py-3 font-semibold">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2f0]">
            {performanceDemo.benchmarks.map((item) => (
              <tr key={item.metric}>
                <td className="px-5 py-4 font-semibold text-[#10201d]">{item.metric}</td>
                <td className="px-5 py-4 text-[#394642]">{item.clinic}</td>
                <td className="px-5 py-4 text-[#65736f]">{item.benchmark}</td>
                <td className="px-5 py-4 font-semibold text-[#087968]">{item.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PerformanceShell>
  );
}

