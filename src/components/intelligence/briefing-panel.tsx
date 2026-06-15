export function BriefingPanel({ items }: { items: string[] }) {
  return (
    <article className="rounded-lg bg-[#10201d] p-5 text-white shadow-sm">
      <p className="text-sm font-semibold text-[#72e5d3]">Owner morning briefing</p>
      <h2 className="mt-3 text-2xl font-semibold">What needs attention today</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <p key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/75">{item}</p>
        ))}
      </div>
    </article>
  );
}

