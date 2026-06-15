import { redirect } from "next/navigation";
import { AiInsightCard } from "@/components/ai/ai-insight-card";
import { AiShell } from "@/components/ai/ai-shell";
import { aiDemo } from "@/lib/ai/data";
import { needsEscalation } from "@/lib/ai/logic";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EscalationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const escalations = aiDemo.leads.filter((lead) => needsEscalation(lead.category, lead.score));

  return (
    <AiShell
      active="/escalations"
      eyebrow="Escalation queue"
      title="High-risk and high-value AI handoffs"
      description="Demo escalation queue for urgent language, clinical risk signals, high lead value, and staff review before patient communication."
    >
      <section className="grid gap-6 lg:grid-cols-2">
        {escalations.map((lead) => (
          <AiInsightCard key={lead.id} lead={lead} />
        ))}
      </section>
    </AiShell>
  );
}

