import type { LiveActivityEvent } from "@/lib/operations/data";

export function ActivityFeed({ events }: { events: LiveActivityEvent[] }) {
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article key={event.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-[#10201d]">{event.actor}</p>
            <span className="text-sm text-[#65736f]">{event.createdAt}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#394642]">
            {event.event} <span className="text-[#65736f]">in {event.area}</span>
          </p>
          <span className="mt-3 inline-flex rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">
            {event.status.replace("_", " ")}
          </span>
        </article>
      ))}
    </div>
  );
}

