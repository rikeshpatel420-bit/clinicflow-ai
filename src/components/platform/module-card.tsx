import type { PlatformModule } from "@/lib/platform/types";

export function ModuleCard({ item }: { item: PlatformModule }) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#087968]">{item.area}</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{item.name}</h2>
        </div>
        <span className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">{item.status}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#65736f]">{item.description}</p>
    </article>
  );
}

