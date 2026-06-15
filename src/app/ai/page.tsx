import { redirect } from "next/navigation";
import { AiInsightCard } from "@/components/ai/ai-insight-card";
import { AiMetricGrid } from "@/components/ai/ai-metric-grid";
import { AiShell } from "@/components/ai/ai-shell";
import { aiDemo } from "@/lib/ai/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AiCommandPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AiShell
      active="/ai"
      eyebrow="AI receptionist foundation"
      title="Lead intelligence command center"
      description="Deterministic demo layer for intent classification, lead scoring, safe response drafts, escalation logic, and revenue-focused next actions."
    >
      <AiMetricGrid metrics={aiDemo.metrics} />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          {aiDemo.leads.map((lead) => (
            <AiInsightCard key={lead.id} lead={lead} />
          ))}
        </div>

        <aside className="grid gap-6">
          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Receptionist workflow states</h2>
            <div className="mt-4 grid gap-3">
              {aiDemo.workflowStates.map((state) => (
                <div key={state} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm font-semibold text-[#394642]">
                  {state.replaceAll("_", " ")}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">Safety guardrails</h2>
            <div className="mt-4 grid gap-3">
              {aiDemo.guardrails.map((rule) => (
                <p key={rule} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{rule}</p>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </AiShell>
  );
}

