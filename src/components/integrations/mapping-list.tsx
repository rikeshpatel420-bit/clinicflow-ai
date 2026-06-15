import type { FieldMapping } from "@/lib/integrations/types";

export function MappingList({ mappings }: { mappings: FieldMapping[] }) {
  return (
    <div className="grid gap-3">
      {mappings.map((mapping) => (
        <div key={`${mapping.source}-${mapping.destination}`} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <p className="font-semibold text-[#10201d]">{mapping.source}</p>
          <p className="mt-1 text-sm text-[#65736f]">to {mapping.destination}</p>
          <p className="mt-2 text-sm text-[#087968]">{mapping.transform}</p>
        </div>
      ))}
    </div>
  );
}

