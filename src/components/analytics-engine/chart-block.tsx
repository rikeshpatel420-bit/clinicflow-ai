export function ChartBlock({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#10201d]">{title}</h2>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[96px_1fr_48px] items-center gap-3 text-sm">
            <p className="font-semibold text-[#10201d]">{item.label}</p>
            <div className="h-3 rounded-md bg-[#edf2f0]">
              <div className="h-3 rounded-md bg-[#18b7a0]" style={{ width: `${Math.min(100, item.value)}%` }} />
            </div>
            <p className="text-right text-[#65736f]">{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

