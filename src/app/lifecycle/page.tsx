import { redirect } from "next/navigation";
import { RevenueOpsShell } from "@/components/revenue-ops/revenue-ops-shell";
import { revenueOpsDemo } from "@/lib/revenue-ops/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LifecyclePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <RevenueOpsShell
      active="/lifecycle"
      eyebrow="Patient lifecycle automation"
      title="Lifecycle revenue map"
      description="Demo operating model for automations across enquiry, booking, treatment acceptance, recovery, retention, and reactivation."
    >
      <section className="grid gap-4">
        {revenueOpsDemo.lifecycle.map((stage) => (
          <article key={stage.stage} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#10201d]">{stage.stage}</h2>
                <p className="mt-2 text-sm text-[#65736f]">{stage.automation}</p>
              </div>
              <p className="text-3xl font-semibold text-[#10201d]">{stage.count}</p>
            </div>
          </article>
        ))}
      </section>
    </RevenueOpsShell>
  );
}

