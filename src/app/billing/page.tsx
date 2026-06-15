import { redirect } from "next/navigation";
import { BillingShell } from "@/components/billing/billing-shell";
import { UsageMeter } from "@/components/billing/usage-meter";
import { billingDemo } from "@/lib/billing/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <BillingShell
      active="/billing"
      eyebrow="SaaS monetisation foundation"
      title="Enterprise billing command center"
      description="Deterministic billing architecture for subscriptions, usage, seats, entitlements, agency separation, and audit-safe financial events."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {billingDemo.usage.map((meter) => (
          <UsageMeter key={meter.key} meter={meter} />
        ))}
      </section>
      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#10201d]">Audit-safe financial events</h2>
        <div className="mt-4 grid gap-3">
          {billingDemo.events.map((event) => (
            <div key={event.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="font-semibold text-[#10201d]">{event.type.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm text-[#65736f]">{event.actor} / {event.createdAt}</p>
            </div>
          ))}
        </div>
      </section>
    </BillingShell>
  );
}

