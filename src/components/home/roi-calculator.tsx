"use client";

import { useMemo, useState } from "react";

function formatPounds(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

export function RoiCalculator() {
  const [missedCalls, setMissedCalls] = useState(80);
  const [averageValue, setAverageValue] = useState(350);
  const [conversionRate, setConversionRate] = useState(28);

  const calculations = useMemo(() => {
    const revenueLost = missedCalls * averageValue;
    const revenueRecoverable = revenueLost * (conversionRate / 100);
    return {
      annualOpportunity: revenueRecoverable * 12,
      revenueLost,
      revenueRecoverable,
    };
  }, [averageValue, conversionRate, missedCalls]);

  return (
    <section className="grid gap-6 rounded-[28px] border border-[#dce6e3] bg-white/90 p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)] backdrop-blur xl:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm font-semibold text-[#087968]">ROI calculator</p>
        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">See the opportunity hiding in missed calls.</h3>
        <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-[#65736f]">
          Adjust the numbers your clinic already knows, and ClinicFlow shows the lost revenue, the amount you can realistically recover, and the annual upside.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Missed calls per month
            <input
              type="number"
              min={0}
              value={missedCalls}
              onChange={(event) => setMissedCalls(Number(event.target.value) || 0)}
              className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Average treatment value
            <input
              type="number"
              min={0}
              value={averageValue}
              onChange={(event) => setAverageValue(Number(event.target.value) || 0)}
              className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
            />
          </label>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-medium text-[#394642]">
          Conversion rate
          <div className="flex items-center gap-4 rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3">
            <input
              type="range"
              min={0}
              max={100}
              value={conversionRate}
              onChange={(event) => setConversionRate(Number(event.target.value))}
              className="h-2 w-full accent-[#087968]"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={conversionRate}
              onChange={(event) => setConversionRate(Number(event.target.value) || 0)}
              className="w-20 rounded-xl border border-[#dce6e3] bg-white px-3 py-2 text-center text-[#10201d] outline-none"
            />
            <span className="text-sm font-semibold text-[#65736f]">%</span>
          </div>
        </label>
      </div>

      <div className="grid gap-4">
        <article className="rounded-[24px] bg-[#10201d] p-6 text-white shadow-[0_24px_90px_rgba(16,33,29,0.25)]">
          <p className="text-sm font-semibold text-[#72e5d3]">Live calculation</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Revenue lost", value: calculations.revenueLost },
              { label: "Revenue recoverable", value: calculations.revenueRecoverable },
              { label: "Annual opportunity", value: calculations.annualOpportunity },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{formatPounds(item.value)}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-white/70">
            Based on the current inputs, clinic admin teams can turn missed enquiries into measurable recovered revenue.
          </p>
        </article>

        <article className="grid gap-3 rounded-[24px] border border-[#dce6e3] bg-[#fbfdfc] p-5">
          <p className="text-sm font-semibold text-[#087968]">What this means</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Lost each month", value: formatPounds(calculations.revenueLost) },
              { label: "Recovered monthly", value: formatPounds(calculations.revenueRecoverable) },
              { label: "Recovered yearly", value: formatPounds(calculations.annualOpportunity) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#edf2f0] bg-white p-4">
                <p className="text-sm text-[#65736f]">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-[#10201d]">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
