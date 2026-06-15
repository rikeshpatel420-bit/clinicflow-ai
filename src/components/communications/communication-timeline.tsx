export function CommunicationTimeline({
  items,
}: {
  items: { id: string; title: string; detail: string; time: string }[];
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#10201d]">{item.title}</p>
            <span className="text-sm text-[#65736f]">{item.time}</span>
          </div>
          <p className="mt-2 text-sm text-[#394642]">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

