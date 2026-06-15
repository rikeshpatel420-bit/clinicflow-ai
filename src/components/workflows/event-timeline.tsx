import type { WorkflowEvent } from "@/lib/workflows/data";
import { StatusPill } from "./status-pill";

export function EventTimeline({ events }: { events: WorkflowEvent[] }) {
  return (
    <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#10201d]">Workflow audit logs</h2>
      <div className="mt-4 grid gap-3">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-[#10201d]">{event.event}</p>
              <StatusPill label={event.severity} />
            </div>
            <p className="mt-2 text-sm text-[#65736f]">{event.entity}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
