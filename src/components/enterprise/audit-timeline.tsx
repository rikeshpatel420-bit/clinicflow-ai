export function EnterpriseAuditTimeline({
  items,
}: {
  items: { id: string; actor: string; action: string; scope: string; time: string }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#10201d]">{item.actor}</p>
            <span className="text-sm text-[#65736f]">{item.time}</span>
          </div>
          <p className="mt-2 text-sm text-[#394642]">{item.action}</p>
          <p className="mt-1 text-sm text-[#65736f]">{item.scope}</p>
        </article>
      ))}
    </div>
  );
}

