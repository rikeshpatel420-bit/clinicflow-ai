export function AutomationTimeline({
  events,
}: {
  events: { id: string; title: string; detail: string; time: string }[];
}) {
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article key={event.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#10201d]">{event.title}</p>
            <span className="text-sm text-[#65736f]">{event.time}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#394642]">{event.detail}</p>
        </article>
      ))}
    </div>
  );
}

