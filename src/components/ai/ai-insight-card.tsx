import type { AiLeadInsight } from "@/lib/ai/data";

const stateTone: Record<AiLeadInsight["state"], string> = {
  awaiting_staff_approval: "bg-[#fef9c3] text-[#854d0e]",
  classified: "bg-[#eef4f2] text-[#394642]",
  closed: "bg-[#e8f8f4] text-[#087968]",
  draft_ready: "bg-[#e8f8f4] text-[#087968]",
  escalated: "bg-[#fee2e2] text-[#991b1b]",
  follow_up_scheduled: "bg-[#ecfdf5] text-[#047857]",
};

export function AiInsightCard({ lead }: { lead: AiLeadInsight }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#087968]">{lead.patientLabel}</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{lead.category.replace("_", " ")}</h2>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${stateTone[lead.state]}`}>{lead.state.replaceAll("_", " ")}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#65736f]">{lead.enquiry}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#f7faf9] p-3">
          <p className="text-xs font-semibold uppercase text-[#65736f]">Lead score</p>
          <p className="mt-1 text-2xl font-semibold text-[#10201d]">{lead.score}</p>
        </div>
        <div className="rounded-lg bg-[#f7faf9] p-3">
          <p className="text-xs font-semibold uppercase text-[#65736f]">Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-[#10201d]">GBP {lead.estimatedRevenue}</p>
        </div>
        <div className="rounded-lg bg-[#f7faf9] p-3">
          <p className="text-xs font-semibold uppercase text-[#65736f]">Mode</p>
          <p className="mt-1 text-sm font-semibold text-[#10201d]">staff approval</p>
        </div>
      </div>
      <p className="mt-5 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-6 text-[#394642]">{lead.nextAction}</p>
    </article>
  );
}

