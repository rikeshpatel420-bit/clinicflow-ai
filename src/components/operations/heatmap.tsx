export function ConversionHeatmap({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-center">
          <div className="mx-auto h-16 w-full rounded-md bg-[#e8f8f4]">
            <div className="h-full rounded-md bg-[#18b7a0]" style={{ opacity: Math.max(0.28, item.value / 100) }} />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#10201d]">{item.label}</p>
          <p className="text-sm text-[#65736f]">{item.value}%</p>
        </div>
      ))}
    </div>
  );
}

