export function TrendPlaceholder({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid h-56 grid-cols-6 items-end gap-3">
      {items.map((item) => (
        <div key={item.label} className="grid gap-2">
          <div className="rounded-t-md bg-[#18b7a0]" style={{ height: `${item.value * 1.8}px` }} />
          <p className="text-center text-xs font-semibold text-[#65736f]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

