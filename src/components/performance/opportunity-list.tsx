export function OpportunityList({
  items,
}: {
  items: { label: string; value: number; urgency: number; likelihood: number; score: number }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#10201d]">{item.label}</p>
              <p className="mt-1 text-sm text-[#65736f]">GBP {item.value.toLocaleString("en-GB")} opportunity</p>
            </div>
            <span className="rounded-md bg-[#10201d] px-2.5 py-1 text-xs font-semibold text-white">{item.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

