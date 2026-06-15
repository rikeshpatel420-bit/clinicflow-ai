export function RecommendationFeed({
  items,
}: {
  items: { title: string; impact: string; action: string }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={item.title} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-semibold text-[#10201d]">{item.title}</h2>
            <span className="rounded-md bg-[#e8f8f4] px-2.5 py-1 text-xs font-semibold text-[#087968]">{item.impact}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#394642]">{item.action}</p>
        </article>
      ))}
    </div>
  );
}

