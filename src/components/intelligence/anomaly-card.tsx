const tone: Record<string, string> = {
  critical: "bg-[#fee2e2] text-[#991b1b]",
  urgent: "bg-[#ffedd5] text-[#9a3412]",
  watch: "bg-[#fef9c3] text-[#854d0e]",
  normal: "bg-[#e8f8f4] text-[#087968]",
};

export function AnomalyCard({ item }: { item: { label: string; level: string; value: string; owner: string } }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-[#10201d]">{item.label}</h2>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone[item.level] ?? tone.normal}`}>{item.level}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#10201d]">{item.value}</p>
      <p className="mt-2 text-sm text-[#65736f]">Owner: {item.owner}</p>
    </article>
  );
}

