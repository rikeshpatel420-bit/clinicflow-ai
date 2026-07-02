import { redirect } from "next/navigation";
import { BillingShell } from "@/components/billing/billing-shell";
import { UsageMeter } from "@/components/billing/usage-meter";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { billingDemo } from "@/lib/billing/data";
import { getClinicSettingsSnapshot } from "@/lib/settings/store";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");
  const membership = user ? await getActiveClinicMembershipForUser(user) : null;
  const snapshot = membership ? await getClinicSettingsSnapshot(membership.clinic_id) : null;
  const config = snapshot?.clinic.business_configuration;

  return (
    <BillingShell
      active="/billing"
      eyebrow="SaaS monetisation foundation"
      title="Enterprise billing command center"
      description="Billing preferences now persist on the clinic record so owners can review the commercial setup without a developer."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(billingDemo.usage.map((meter) => ({
          ...meter,
          limit: meter.key === "seats" ? Number(config?.billingPreferences.seats ?? meter.limit) : meter.limit,
        })) as typeof billingDemo.usage).map((meter) => (
          <UsageMeter key={meter.key} meter={meter} />
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Saved billing preferences</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {[
              ["Plan", config?.billingPreferences.planKey ?? billingDemo.subscription.planKey],
              ["Seats", config?.billingPreferences.seats ?? String(billingDemo.subscription.seats)],
              ["Cycle", config?.billingPreferences.cycle ?? billingDemo.subscription.cycle],
              ["Currency", config?.billingPreferences.currency ?? "GBP"],
              ["Invoicing", config?.billingPreferences.invoicing ?? "Monthly invoicing"],
              ["Payment terms", config?.billingPreferences.paymentTerms ?? "30 days"],
              ["Tax mode", config?.billingPreferences.taxMode ?? "VAT inclusive"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Subscription</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {[
              ["Status", config?.subscription.status ?? billingDemo.subscription.status],
              ["Plan", config?.subscription.plan ?? billingDemo.subscription.planKey],
              ["Renewal", config?.subscription.renewal ?? billingDemo.subscription.renewsAt],
              ["Trial ends", config?.subscription.trialEndsAt ?? billingDemo.subscription.trialEndsAt],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#10201d]">Audit-safe financial events</h2>
        <div className="mt-4 grid gap-3">
          {billingDemo.events.map((event) => (
            <div key={event.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="font-semibold text-[#10201d]">{event.type.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm text-[#65736f]">
                {event.actor} / {event.createdAt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </BillingShell>
  );
}

