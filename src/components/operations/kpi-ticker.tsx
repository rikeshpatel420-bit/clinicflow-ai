export function KpiTicker({ items }: { items: { label: string; value: string; trend: string }[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#65736f]">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{item.value}</p>
          <p className="mt-2 text-sm font-semibold text-[#087968]">{item.trend}</p>
        </article>
      ))}
    </section>
  );
}

