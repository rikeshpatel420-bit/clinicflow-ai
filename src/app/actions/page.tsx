import { redirect } from "next/navigation";
import { AutomationShell } from "@/components/automation-engine/automation-shell";
import { actionRegistry } from "@/lib/automation-engine/registry";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AutomationShell
      active="/actions"
      eyebrow="Action registry"
      title="Automation action system"
      description="Action primitives for task assignment, escalation routing, notification drafting, follow-up scheduling, and audit tracking."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {Object.entries(actionRegistry).map(([key, action]) => (
          <article key={key} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{key}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{action.label}</h2>
            <p className="mt-3 text-sm leading-6 text-[#65736f]">{action.description}</p>
          </article>
        ))}
      </section>
    </AutomationShell>
  );
}

