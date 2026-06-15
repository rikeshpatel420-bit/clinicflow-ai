import type { FeatureFlag } from "@/lib/platform/types";

export function FeatureFlagList({ flags }: { flags: FeatureFlag[] }) {
  return (
    <div className="grid gap-3">
      {flags.map((flag) => (
        <article key={flag.key} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#10201d]">{flag.label}</p>
              <p className="mt-1 text-sm text-[#65736f]">{flag.key}</p>
            </div>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">{flag.state}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

