import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReceptionConsoleData, ReceptionQueueItem } from "@/lib/reception/data";
import {
  confirmReceptionBookingRequestAction,
  markReceptionAppointmentRescheduleAction,
  markReceptionBookingRequestContactedAction,
  markReceptionBookingRequestLostAction,
  sendReceptionSmsConfirmationSimulationAction,
} from "@/app/reception/actions";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7b76]">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-[#10201d]">{value || "Not captured"}</dd>
    </div>
  );
}

function sectionToneClass(kind: ReceptionQueueItem["kind"]) {
  switch (kind) {
    case "booking_request":
      return "border-[#c8eee6] bg-white";
    case "urgent_enquiry":
      return "border-[#f2dfd8] bg-[#fffaf7]";
    case "missed_call":
      return "border-[#dbe6e2] bg-white";
    case "appointment":
      return "border-[#d6e4f0] bg-[#fbfdff]";
    default:
      return "border-[#dbe6e2] bg-white";
  }
}

function statusClass(tone: ReceptionQueueItem["statusTone"]) {
  if (tone === "warning") return "border-[#f2dfd8] bg-[#fff9f6] text-[#9a3412]";
  if (tone === "positive") return "border-[#c8eee6] bg-[#f6fffc] text-[#087968]";
  return "border-[#dbe6e2] bg-white text-[#52615d]";
}

function actionButtonClass(variant: "primary" | "secondary" | "danger") {
  if (variant === "primary") {
    return "rounded-full bg-[#087968] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.18)] transition hover:bg-[#066657]";
  }

  if (variant === "danger") {
    return "rounded-full border border-[#f2dfd8] bg-[#fff9f6] px-3.5 py-2 text-xs font-semibold text-[#9a3412] transition hover:border-[#f1c8b6]";
  }

  return "rounded-full border border-[#cdd8d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#10201d] transition hover:border-[#9db2ad]";
}

function QueueItemActions({ item }: { item: ReceptionQueueItem }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {item.kind === "booking_request" ? (
        <form action={confirmReceptionBookingRequestAction}>
          <input type="hidden" name="booking_request_id" value={item.bookingRequestId ?? ""} />
          <button type="submit" className={actionButtonClass("primary")}>
            Confirm appointment
          </button>
        </form>
      ) : null}

      {item.kind === "appointment" ? (
        <form action={markReceptionAppointmentRescheduleAction}>
          <input type="hidden" name="appointment_id" value={item.appointmentId ?? ""} />
          <button type="submit" className={actionButtonClass("secondary")}>
            Reschedule needed
          </button>
        </form>
      ) : null}

      <form action={markReceptionBookingRequestContactedAction}>
        <input type="hidden" name="booking_request_id" value={item.bookingRequestId ?? ""} />
        <input type="hidden" name="lead_id" value={item.leadId ?? ""} />
        <input type="hidden" name="call_id" value={item.callId ?? ""} />
        <button type="submit" className={actionButtonClass("secondary")}>
          Mark contacted
        </button>
      </form>

      <form action={sendReceptionSmsConfirmationSimulationAction}>
        <input type="hidden" name="booking_request_id" value={item.bookingRequestId ?? ""} />
        <input type="hidden" name="appointment_id" value={item.appointmentId ?? ""} />
        <input type="hidden" name="lead_id" value={item.leadId ?? ""} />
        <input type="hidden" name="call_id" value={item.callId ?? ""} />
        <button type="submit" className={actionButtonClass("primary")}>
          Send SMS confirmation
        </button>
      </form>

      <form action={markReceptionBookingRequestLostAction}>
        <input type="hidden" name="booking_request_id" value={item.bookingRequestId ?? ""} />
        <input type="hidden" name="lead_id" value={item.leadId ?? ""} />
        <input type="hidden" name="call_id" value={item.callId ?? ""} />
        <button type="submit" className={actionButtonClass("danger")}>
          Mark lost
        </button>
      </form>
    </div>
  );
}

function QueueCard({ title, description, items, emptyTitle, emptyMessage }: { title: string; description: string; emptyMessage: string; emptyTitle: string; items: ReceptionQueueItem[] }) {
  return (
    <section className="rounded-[28px] border border-[#dbe6e2] bg-white p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
      <div className="flex flex-col gap-2 border-b border-[#edf2f0] pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#10201d]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#65736f]">{description}</p>
          </div>
          <span className="rounded-full border border-[#dbe6e2] bg-[#fbfdfc] px-3 py-1.5 text-xs font-semibold text-[#52615d]">
            {items.length}
          </span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-4">
          {items.slice(0, 5).map((item) => (
            <article key={item.id} className={`rounded-[24px] border p-4 shadow-sm ${sectionToneClass(item.kind)}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#10201d]">{item.patientLabel}</p>
                  <p className="mt-1 text-sm leading-6 text-[#52615d]">{item.treatmentType}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(item.statusTone)}`}>{item.status.replace(/_/g, " ")}</span>
                  <span className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#52615d]">
                    Urgency {item.urgencyScore}/100
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Patient name" value={item.patientLabel} />
                <Field label="Phone number" value={item.patientPhone} />
                <Field label="Treatment" value={item.treatmentType} />
                <Field label="Appointment type" value={item.appointmentType} />
                <Field label="Preferred date" value={item.preferredDate} />
                <Field label="Preferred time" value={item.preferredTime} />
                <Field label="Confirmed date" value={item.confirmedDate} />
                <Field label="Confirmed time" value={item.confirmedTime ?? formatDateTime(item.scheduledAt)} />
                <Field label="Reference number" value={item.confirmationReference ?? "Not confirmed yet"} />
                <Field label="Status" value={item.status.replace(/_/g, " ")} />
              </dl>

              <details className="mt-4 rounded-2xl border border-[#edf2f0] bg-white/70 p-3 text-sm text-[#52615d]">
                <summary className="cursor-pointer font-semibold text-[#10201d]">Conversation</summary>
                <p className="mt-2 leading-6">{item.conversation ?? item.snippet}</p>
              </details>

              <QueueItemActions item={item} />
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState title={emptyTitle} message={emptyMessage} />
        </div>
      )}
    </section>
  );
}

function LiveSidebar({ data }: { data: ReceptionConsoleData }) {
  const currentCall = data.currentCall;

  return (
    <aside className="grid gap-6">
      <section className="rounded-[28px] border border-[#10201d] bg-[#10201d] p-6 text-white shadow-[0_24px_100px_rgba(16,33,29,0.2)]">
        <p className="text-sm font-semibold text-[#72e5d3]">Live reception</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">One calm workspace for the front desk.</h2>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Keep booking requests, urgent enquiries, missed calls, and confirmed appointments in one place without hopping between views.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Link href="/dashboard" className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-center font-semibold text-white hover:bg-white/15">
            Dashboard
          </Link>
          <Link href="/calls" className="rounded-full bg-[#72e5d3] px-4 py-2.5 text-center font-semibold text-[#071311] hover:bg-[#60d7c5]">
            Calls
          </Link>
          <Link href="/calendar" className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-center font-semibold text-white hover:bg-white/15">
            Calendar
          </Link>
          <Link href="/patients" className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-center font-semibold text-white hover:bg-white/15">
            Patients
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">Latest live call</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">
          {currentCall?.callerLabel ?? "Awaiting the next patient call"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#52615d]">
          {currentCall?.liveTranscription ?? "The console will update when the next call is captured."}
        </p>
        <dl className="mt-4 grid gap-3 text-sm text-[#52615d]">
          <div className="flex items-center justify-between gap-3">
            <dt>Status</dt>
            <dd className="font-semibold text-[#10201d]">{currentCall?.callStatus ?? "Ready"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Recovery</dt>
            <dd className="font-semibold text-[#10201d]">{currentCall?.recoveryStatus ?? "Not started"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt>Urgency</dt>
            <dd className="font-semibold text-[#10201d]">{currentCall?.aiConfidence ?? 0}/100</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[28px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">AI summary draft</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Reception handover</h2>
        <div className="mt-4 grid gap-3 text-sm leading-7 text-[#52615d]">
          <p><span className="font-semibold text-[#10201d]">Patient summary:</span> {data.summary.patientSummary}</p>
          <p><span className="font-semibold text-[#10201d]">Reception notes:</span> {data.summary.receptionNotes}</p>
          <p><span className="font-semibold text-[#10201d]">Next step:</span> {data.summary.appointmentRecommendation}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">Recent activity</p>
        <div className="mt-4 grid gap-3">
          {data.recentEvents.slice(0, 5).map((event) => (
            <article key={event.id} className="rounded-[20px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="text-sm font-semibold text-[#10201d]">{event.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#52615d]">{event.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function ReceptionWorkspace({ data }: { data: ReceptionConsoleData }) {
  const counts = {
    appointments: data.queues.appointments.length,
    bookingRequests: data.queues.bookingRequests.length,
    missedCalls: data.queues.missedCalls.length,
    urgentEnquiries: data.queues.urgentEnquiries.length,
  };

  return (
    <section className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.2fr)_380px] xl:px-8">
      <div className="grid gap-6">
        <section className="rounded-[32px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-[#087968]">Reception dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d] md:text-5xl">
                One workspace for calls, booking requests, and appointment follow-up.
              </h1>
              <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-[#52615d]">
                Keep the front desk calm and moving with live queues for bookings, urgent dental enquiries, missed calls, and confirmed appointments.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                Dashboard
              </Link>
              <Link href="/calls" className="rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
                Calls
              </Link>
              <Link href="/calendar" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                Calendar
              </Link>
              <Link href="/patients" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                Patients
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "New booking requests", value: counts.bookingRequests, note: "Waiting for confirmation" },
              { label: "Urgent dental enquiries", value: counts.urgentEnquiries, note: "Needs careful triage" },
              { label: "Missed calls", value: counts.missedCalls, note: "Need follow-up" },
              { label: "Confirmed appointments", value: counts.appointments, note: "Today and upcoming" },
            ].map((metric) => (
              <article key={metric.label} className="rounded-[24px] border border-[#edf2f0] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-[#65736f]">{metric.note}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <QueueCard
            title="New booking requests"
            description="Capture requests from the AI receptionist and convert them into confirmed appointments."
            emptyTitle="No booking requests"
            emptyMessage="Booking requests will appear here once the AI captures a booking flow."
            items={data.queues.bookingRequests}
          />
          <QueueCard
            title="Urgent dental enquiries"
            description="High-priority enquiries that need a calm, prompt receptionist follow-up."
            emptyTitle="No urgent enquiries"
            emptyMessage="Urgent enquiries will appear here when the AI flags a high-priority call."
            items={data.queues.urgentEnquiries}
          />
          <QueueCard
            title="Missed calls needing follow-up"
            description="Calls that need a staff callback, SMS confirmation, or a decision on whether they are lost."
            emptyTitle="No missed calls"
            emptyMessage="Missed calls will appear here after the next live call is captured."
            items={data.queues.missedCalls}
          />
          <QueueCard
            title="Confirmed appointments today/upcoming"
            description="Keep an eye on the diary and reschedule or confirm where needed."
            emptyTitle="No confirmed appointments"
            emptyMessage="Confirmed appointments will appear here once a slot has been secured."
            items={data.queues.appointments}
          />
        </div>
      </div>

      <LiveSidebar data={data} />
    </section>
  );
}
