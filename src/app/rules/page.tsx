import { redirect } from "next/navigation";
import { AutomationShell } from "@/components/automation-engine/automation-shell";
import { RuleCard } from "@/components/automation-engine/rule-card";
import { automationEngineDemo } from "@/lib/automation-engine/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AutomationShell
      active="/rules"
      eyebrow="Automation rules engine"
      title="Rule builder foundation"
      description="Deterministic rule-based automation architecture for triggers, actions, priority thresholds, and staff-safe execution."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {automationEngineDemo.rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </section>
    </AutomationShell>
  );
}

