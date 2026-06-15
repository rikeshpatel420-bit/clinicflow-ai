export function KpiCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#65736f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#10201d]">{value}</p>
      {note ? <p className="mt-2 text-sm font-semibold text-[#087968]">{note}</p> : null}
    </article>
  );
}

