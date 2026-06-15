import type { RevenueOpportunity } from "@/lib/revenue-ops/data";

export function OpportunityCard({ item }: { item: RevenueOpportunity }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#087968]">{item.type.replaceAll("_", " ")}</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{item.patient}</h2>
        </div>
        <span className="rounded-md bg-[#10201d] px-2.5 py-1 text-xs font-semibold text-white">{item.score}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-[#10201d]">GBP {item.value.toLocaleString("en-GB")}</p>
      <p className="mt-2 text-sm text-[#65736f]">Stage {item.stage} / Cadence {item.cadence.replace("_", " ")}</p>
      <p className="mt-4 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{item.recommendation}</p>
    </article>
  );
}

