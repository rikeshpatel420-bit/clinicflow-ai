export function AiMetricGrid({ metrics }: { metrics: { label: string; value: string; note: string }[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#65736f]">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-[#10201d]">{metric.value}</p>
          <p className="mt-2 text-sm font-semibold text-[#087968]">{metric.note}</p>
        </article>
      ))}
    </section>
  );
}

