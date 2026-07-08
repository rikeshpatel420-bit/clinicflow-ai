import { EmptyState } from "@/components/ui/empty-state";
import type { AppointmentRow, BookingRequestRow } from "@/lib/dashboard/live-data";
import { cancelAppointmentAction, confirmBookingRequestAction, markAppointmentRescheduleNeededAction, markBookingRequestContactedAction } from "@/app/calendar/actions";

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function isUrgentBooking(request: BookingRequestRow) {
  const text = `${request.booking_type} ${request.next_step ?? ""} ${request.notes ?? ""}`.toLowerCase();
  return /emergency|urgent|same day|swelling|bleeding|pain/.test(text);
}

function isUrgentAppointment(appointment: AppointmentRow) {
  const text = `${appointment.treatment_type} ${appointment.notes ?? ""}`.toLowerCase();
  return /emergency|urgent|same day|swelling|bleeding|pain/.test(text);
}

export function AppointmentsPanel({
  appointments,
  bookingRequests,
}: {
  appointments: AppointmentRow[];
  bookingRequests: BookingRequestRow[];
}) {
  const confirmedAppointments = appointments.filter((appointment) => appointment.status === "confirmed");
  const pendingRequests = bookingRequests.filter((request) => request.status === "requested");
  const urgentRequests = [
    ...pendingRequests.filter(isUrgentBooking),
    ...appointments.filter((appointment) => appointment.status === "reschedule_needed" || (appointment.status !== "cancelled" && isUrgentAppointment(appointment))),
  ];

  return (
    <section className="rounded-[28px] border border-[#dbe6e2] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3 border-b border-[#edf2f0] pb-5 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#10201d] dark:text-white">Appointments</h2>
          <p className="mt-1 text-sm text-[#65736f] dark:text-slate-400">Confirmed appointments and booking requests captured from the call flow.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#e8f8f4] px-3 py-1.5 text-[#087968]">Confirmed {confirmedAppointments.length}</span>
          <span className="rounded-full bg-[#f3f7f6] px-3 py-1.5 text-[#41524c]">Pending {pendingRequests.length}</span>
          <span className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-[#9a3412]">Urgent {urgentRequests.length}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#65736f]">Confirmed appointments</h3>
              <span className="text-xs font-medium text-[#65736f]">{confirmedAppointments.length} live</span>
            </div>
            {confirmedAppointments.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {confirmedAppointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-[#dce6e3] bg-[#fbfdfc] p-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#10201d] dark:text-white">{appointment.confirmation_reference}</p>
                        <p className="mt-1 text-sm text-[#65736f] dark:text-slate-400">{appointment.patient_name ?? "Patient details captured from the call"}</p>
                      </div>
                      <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">
                        {formatLabel(appointment.status)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[#41524c] dark:text-slate-300">
                      <p>
                        <span className="font-medium text-[#10201d] dark:text-white">Start:</span>{" "}
                        {formatDateTime(appointment.appointment_start)}
                      </p>
                      <p>
                        <span className="font-medium text-[#10201d] dark:text-white">Finish:</span>{" "}
                        {formatDateTime(appointment.appointment_end)}
                      </p>
                      <p>
                        <span className="font-medium text-[#10201d] dark:text-white">Type:</span>{" "}
                        {formatLabel(appointment.treatment_type)}
                      </p>
                      <p>
                        <span className="font-medium text-[#10201d] dark:text-white">Source:</span>{" "}
                        {formatLabel(appointment.source)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={cancelAppointmentAction}>
                        <input type="hidden" name="appointment_id" value={appointment.id} />
                        <button type="submit" className="rounded-full border border-[#cdd8d5] bg-white px-3 py-2 text-xs font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                          Cancel
                        </button>
                      </form>
                      <form action={markAppointmentRescheduleNeededAction}>
                        <input type="hidden" name="appointment_id" value={appointment.id} />
                        <button type="submit" className="rounded-full border border-[#f2dfd8] bg-[#fff9f6] px-3 py-2 text-xs font-semibold text-[#9a3412] shadow-sm hover:border-[#f1c8b6]">
                          Reschedule needed
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState title="No confirmed appointments" message="Confirmed bookings will appear here once a slot is secured." />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#65736f]">Pending booking requests</h3>
              <span className="text-xs font-medium text-[#65736f]">{pendingRequests.length} waiting</span>
            </div>
            {pendingRequests.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {pendingRequests.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-[#dce6e3] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#10201d] dark:text-white">{request.confirmation_reference}</p>
                        <p className="mt-1 text-sm text-[#65736f] dark:text-slate-400">{formatLabel(request.booking_type)}</p>
                      </div>
                      <span className="rounded-full border border-[#cdd8d5] bg-[#f7faf9] px-3 py-1 text-xs font-semibold text-[#41524c]">
                        {formatLabel(request.status)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[#41524c] dark:text-slate-300">
                      <p>
                        <span className="font-medium text-[#10201d] dark:text-white">Preferred time:</span>{" "}
                        {request.preferred_time ?? "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium text-[#10201d] dark:text-white">Next step:</span>{" "}
                        {request.next_step ?? "Practice to confirm the exact time shortly."}
                      </p>
                      <p className="text-xs text-[#65736f] dark:text-slate-400">
                        Requested {formatDateTime(request.requested_at)}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={confirmBookingRequestAction}>
                        <input type="hidden" name="booking_request_id" value={request.id} />
                        <button type="submit" className="rounded-full bg-[#087968] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#066657]">
                          Confirm
                        </button>
                      </form>
                      <form action={markBookingRequestContactedAction}>
                        <input type="hidden" name="booking_request_id" value={request.id} />
                        <button type="submit" className="rounded-full border border-[#cdd8d5] bg-white px-3 py-2 text-xs font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                          Mark contacted
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState title="No booking requests" message="New requests will appear here when the AI captures a booking flow." />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#65736f]">Urgent requests</h3>
              <span className="text-xs font-medium text-[#65736f]">{urgentRequests.length} high priority</span>
            </div>
            {urgentRequests.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {urgentRequests.slice(0, 4).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[#f2dfd8] bg-[#fff9f6] p-4 dark:border-[#6b3d28] dark:bg-[#20140f]">
                    <p className="text-sm font-semibold text-[#9a3412] dark:text-[#f8b68f]">{item.confirmation_reference}</p>
                    <p className="mt-1 text-sm text-[#7c2d12] dark:text-[#f8c6a0]">
                      {"appointment_start" in item ? formatDateTime(item.appointment_start) : item.preferred_time ?? "Urgent review"}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <EmptyState title="No urgent requests" message="High-priority items will be highlighted here." />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
