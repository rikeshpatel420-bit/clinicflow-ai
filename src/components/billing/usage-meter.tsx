import type { UsageMeter as UsageMeterType } from "@/lib/billing/types";
import { usagePercentage } from "@/lib/billing/quotas";

export function UsageMeter({ meter }: { meter: UsageMeterType }) {
  const percentage = usagePercentage(meter);
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-[#10201d]">{meter.label}</h2>
        <span className="text-sm font-semibold text-[#087968]">{percentage}%</span>
      </div>
      <div className="mt-4 h-2 rounded-md bg-[#edf2f0]">
        <div className="h-2 rounded-md bg-[#18b7a0]" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-3 text-sm text-[#65736f]">{meter.used.toLocaleString("en-GB")} of {meter.limit.toLocaleString("en-GB")}</p>
    </article>
  );
}

