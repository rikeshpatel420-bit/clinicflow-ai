import type { ActivityItem } from "@/lib/settings/data";

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-[#10201d]">{item.actor}</p>
            <p className="text-sm text-[#65736f]">{item.createdAt}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#394642]">
            {item.action} <span className="text-[#65736f]">in {item.area}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

