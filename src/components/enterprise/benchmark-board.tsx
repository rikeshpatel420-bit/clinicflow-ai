export function BenchmarkBoard({
  items,
}: {
  items: { name: string; healthScore: number; benchmark: number; position: string }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={item.name} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#10201d]">{item.name}</p>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">{item.position}</span>
          </div>
          <div className="mt-3 h-2 rounded-md bg-[#edf2f0]">
            <div className="h-2 rounded-md bg-[#18b7a0]" style={{ width: `${item.healthScore}%` }} />
          </div>
          <p className="mt-2 text-sm text-[#65736f]">Clinic {item.healthScore} / benchmark {item.benchmark}</p>
        </article>
      ))}
    </div>
  );
}

