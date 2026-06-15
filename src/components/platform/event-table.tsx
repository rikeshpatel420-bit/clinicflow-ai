import type { PlatformEvent } from "@/lib/platform/types";

export function EventTable({ events }: { events: PlatformEvent[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#dce6e3] bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-5 py-3 font-semibold">Topic</th>
            <th className="px-5 py-3 font-semibold">Producer</th>
            <th className="px-5 py-3 font-semibold">Consumer</th>
            <th className="px-5 py-3 font-semibold">Audit safe</th>
            <th className="px-5 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-5 py-4 font-semibold text-[#10201d]">{event.topic}</td>
              <td className="px-5 py-4 text-[#394642]">{event.producer}</td>
              <td className="px-5 py-4 text-[#394642]">{event.consumer}</td>
              <td className="px-5 py-4 text-[#087968]">{event.auditSafe ? "yes" : "no"}</td>
              <td className="px-5 py-4 text-[#65736f]">{event.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

