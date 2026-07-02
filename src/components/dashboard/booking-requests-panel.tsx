import { EmptyState } from "@/components/ui/empty-state";
import type { BookingRequestRow } from "@/lib/dashboard/live-data";

function formatState(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRequestType(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function BookingRequestsPanel({ requests }: { requests: BookingRequestRow[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Appointment requests</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live booking requests captured from calls and follow-up replies.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Confirmation refs
        </span>
      </div>

      {requests.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{request.confirmation_reference}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatRequestType(request.booking_type)}</p>
                </div>
                <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-400/10 dark:text-teal-200">
                  {formatState(request.status)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-medium text-slate-800 dark:text-slate-100">Preferred time:</span>{" "}
                  {request.preferred_time ?? "Not captured"}
                </p>
                <p>
                  <span className="font-medium text-slate-800 dark:text-slate-100">Next step:</span>{" "}
                  {request.next_step ?? "Practice to confirm the exact time shortly."}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requested {new Intl.DateTimeFormat("en-GB", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "short" }).format(new Date(request.requested_at))}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="No appointment requests" message="Booking requests will appear here once a caller finishes the booking flow." />
        </div>
      )}
    </section>
  );
}
