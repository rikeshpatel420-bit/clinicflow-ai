"use client";

import { useEffect, useMemo, useState } from "react";

export type AnimatedMetric = {
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
  note?: string;
};

function formatValue(value: number, prefix = "", suffix = "") {
  const rounded = Math.round(value);
  return `${prefix}${rounded.toLocaleString("en-GB")}${suffix}`;
}

export function AnimatedMetrics({ metrics }: { metrics: AnimatedMetric[] }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 1300;

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setProgress(eased);

      if (elapsed < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  const values = useMemo(
    () =>
      metrics.map((metric) => ({
        ...metric,
        animatedValue: metric.value * progress,
      })),
    [metrics, progress]
  );

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {values.map((metric) => (
        <article
          key={metric.label}
          className="rounded-2xl border border-white/30 bg-white/12 p-5 shadow-[0_20px_80px_rgba(8,121,104,0.12)] backdrop-blur-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{metric.label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {formatValue(metric.animatedValue, metric.prefix, metric.suffix)}
          </p>
          {metric.note ? <p className="mt-3 text-sm leading-6 text-white/70">{metric.note}</p> : null}
        </article>
      ))}
    </section>
  );
}
