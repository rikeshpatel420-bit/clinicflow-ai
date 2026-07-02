import Link from "next/link";
import type { ClinicDashboardData } from "@/lib/dashboard/live-data";

function formatCurrency(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

function progressTone(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-rose-500";
}

export function BusinessHealthPanel({
  summary,
  readinessScore,
  readinessLabel,
  missingSteps,
}: {
  missingSteps: string[];
  readinessLabel: string;
  readinessScore: number;
  summary: ClinicDashboardData["businessSummary"];
}) {
  const cards = [
    { label: "Calls today", value: summary.callsToday.toString(), note: "Incoming call volume" },
    { label: "Bookings", value: summary.bookings.toString(), note: "Recovered into the diary" },
    { label: "Revenue estimate", value: formatCurrency(summary.revenueEstimatePence), note: "Opportunity in motion" },
    { label: "Missed calls", value: summary.missedCalls.toString(), note: "Needs recovery" },
    { label: "AI handled", value: `${summary.aiHandledPercent}%`, note: "Answered or summarised" },
    { label: "Unread enquiries", value: summary.unreadEnquiries.toString(), note: "Waiting for response" },
    { label: "Outstanding tasks", value: summary.outstandingTasks.toString(), note: "Follow-up items" },
  ];

  return (
    <section className="grid gap-6 rounded-[34px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)] xl:grid-cols-[1.15fr_0.85fr]">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-[#087968]">Business health</p>
          <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">
            {readinessLabel}
          </span>
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d] sm:text-4xl">The business cockpit a real owner can use on day one.</h2>
        <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-[#52615d]">
          This view combines live clinic activity with go-live readiness so a new customer can see calls, bookings, revenue, and setup
          gaps without needing a technical explanation.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.label} className="rounded-[24px] border border-[#edf2f0] bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">{card.note}</p>
            </article>
          ))}
        </div>
      </div>

      <aside className="grid content-start gap-4 rounded-[30px] border border-[#edf2f0] bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-[#087968]">Go-live readiness</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[#10201d]">{readinessScore}%</p>
              <p className="mt-1 text-sm text-[#65736f]">Configuration score</p>
            </div>
            <Link href="/system" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
              Check readiness
            </Link>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#eef4f2]">
            <div className={`h-full rounded-full ${progressTone(readinessScore)}`} style={{ width: `${Math.max(6, readinessScore)}%` }} />
          </div>
        </div>

        <div className="grid gap-3">
          {missingSteps.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Still missing</p>
              {missingSteps.slice(0, 4).map((step) => (
                <div key={step} className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  {step}
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-[18px] border border-[#c8eee6] bg-[#f7fffd] px-4 py-4 text-sm leading-6 text-[#087968]">
              Everything required for a live launch is configured.
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
