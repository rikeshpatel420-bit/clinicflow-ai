import Link from "next/link";

function formatCurrency(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export function DemoKpiBand({
  appointmentsBooked,
  missedCalls,
  recoveryRate,
  revenueRecoveredPence,
  sourceLabel,
  title = "Demo data mode",
  description = "A realistic clinic snapshot keeps the product feeling active while the real customer data is loading.",
}: {
  appointmentsBooked: number;
  missedCalls: number;
  recoveryRate: number;
  revenueRecoveredPence: number;
  sourceLabel: string;
  title?: string;
  description?: string;
}) {
  const items = [
    { label: "Recovered revenue", value: formatCurrency(revenueRecoveredPence) },
    { label: "Missed calls", value: missedCalls.toLocaleString("en-GB") },
    { label: "Appointments booked", value: appointmentsBooked.toLocaleString("en-GB") },
    { label: "Response rate", value: `${recoveryRate}%` },
  ];

  return (
    <section className="grid gap-4 rounded-[28px] border border-[#c8eee6] bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf8_100%)] p-5 shadow-[0_24px_100px_rgba(8,121,104,0.08)] md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-sm font-semibold text-[#087968]">{sourceLabel}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65736f]">{description}</p>
      </div>
      <Link
        href="/calls"
        className="inline-flex items-center justify-center rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm transition hover:border-[#9db2ad]"
      >
        Review calls
      </Link>

      <div className="grid gap-3 md:col-span-2 xl:grid-cols-4">
        {items.map((item) => (
          <article key={item.label} className="rounded-[22px] border border-[#e4ebe8] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
