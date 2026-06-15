import type { BillingPlan } from "@/lib/billing/plans";

export function PlanCard({ plan }: { plan: BillingPlan & { displayPrice: string } }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-[#087968]">{plan.key}</p>
      <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{plan.name}</h2>
      <p className="mt-4 text-3xl font-semibold text-[#10201d]">{plan.displayPrice}</p>
      <p className="mt-2 text-sm text-[#65736f]">{plan.clinicsIncluded} clinic allowance</p>
      <div className="mt-5 grid gap-2">
        {plan.features.map((feature) => (
          <p key={feature} className="rounded-md bg-[#f7faf9] px-3 py-2 text-sm text-[#394642]">{feature}</p>
        ))}
      </div>
    </article>
  );
}

