import { redirect } from "next/navigation";
import { AutomationShell } from "@/components/automation-engine/automation-shell";
import { triggerRegistry } from "@/lib/automation-engine/registry";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TriggersPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AutomationShell
      active="/triggers"
      eyebrow="Trigger registry"
      title="Patient lifecycle and recovery triggers"
      description="Registry for missed calls, SLA breaches, lifecycle changes, reactivation, and campaign reply events."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {Object.entries(triggerRegistry).map(([key, trigger]) => (
          <article key={key} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{key}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{trigger.label}</h2>
            <p className="mt-3 text-sm leading-6 text-[#65736f]">{trigger.description}</p>
          </article>
        ))}
      </section>
    </AutomationShell>
  );
}

