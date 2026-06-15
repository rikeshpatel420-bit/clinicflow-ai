import { redirect } from "next/navigation";
import { IntelligenceShell } from "@/components/intelligence/intelligence-shell";
import { intelligenceDemo } from "@/lib/intelligence/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PerformanceCenterPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntelligenceShell
      active="/performance-center"
      eyebrow="Staff and funnel intelligence"
      title="Clinic performance center"
      description="Staff visibility, front-desk efficiency, conversion funnel, and treatment acceptance intelligence in one owner view."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Conversion funnel analytics</h2>
          <div className="mt-4 grid gap-3">
            {intelligenceDemo.funnel.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="font-semibold text-[#10201d]">{item.label}</p>
                <p className="text-2xl font-semibold text-[#10201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Staff performance visibility</h2>
          <div className="mt-4 grid gap-3">
            {intelligenceDemo.staff.map((item) => (
              <div key={item.name} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{item.name}</p>
                  <p className="text-sm font-semibold text-[#087968]">{item.efficiency}</p>
                </div>
                <p className="mt-1 text-sm text-[#65736f]">{item.role} / {item.conversion} conversion</p>
                <p className="mt-2 text-sm text-[#394642]">{item.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </IntelligenceShell>
  );
}

