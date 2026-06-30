import Link from "next/link";
import type { TwilioOperationsDashboardData } from "@/lib/twilio/integration";

function formatDate(value: string | null) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function statusTone(status: string) {
  if (["recovered", "ready", "available", "transcribed", "sent", "delivered", "answered"].includes(status)) return "text-teal-700 bg-teal-50 border-teal-200";
  if (["missed", "voicemail", "failed", "lost"].includes(status)) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-700 bg-slate-50 border-slate-200";
}

function summaryCards(data: TwilioOperationsDashboardData) {
  return [
    { label: "Active calls", value: data.activeCalls.length },
    { label: "Recent calls", value: data.recentCalls.length },
    { label: "Missed calls", value: data.missedCalls.length },
    { label: "SMS conversations", value: data.smsConversations.length },
    { label: "Voicemails", value: data.voicemails.length },
  ];
}

export function TwilioOperationsBoard({ data }: { data: TwilioOperationsDashboardData }) {
  const hasAnyActivity =
    data.activeCalls.length > 0 ||
    data.recentCalls.length > 0 ||
    data.missedCalls.length > 0 ||
    data.smsConversations.length > 0 ||
    data.voicemails.length > 0 ||
    data.recordings.length > 0 ||
    data.transcripts.length > 0;

  return (
    <section className="grid gap-6">
      {!hasAnyActivity ? (
        <section className="rounded-[20px] border border-[#dce6e3] bg-white p-4 text-sm text-[#65736f] shadow-sm">
          <p className="font-semibold text-[#10201d]">No activity yet</p>
          <p className="mt-1">
            {data.warnings.length > 0
              ? "The production schema is still missing one or more of call_recordings, voicemail_messages, or call_transcripts. Empty states are shown until the media migration is applied."
              : "Calls, SMS replies, voicemails, and transcripts will appear here once Twilio traffic starts flowing."}
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards(data).map((item) => (
          <article key={item.label} className="rounded-[24px] border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{item.value}</p>
          </article>
        ))}
      </div>

      {data.warnings.length > 0 ? (
        <section className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Twilio media tables pending</p>
          <p className="mt-1">The route layer is ready, but some voice media tables are not available yet in this environment.</p>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Active calls</p>
              <h3 className="mt-1 text-xl font-semibold text-[#10201d]">Calls currently in flight</h3>
            </div>
            <Link href="/calls" className="text-sm font-semibold text-[#087968] hover:text-[#066657]">
              Open calls
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {data.activeCalls.length > 0 ? (
              data.activeCalls.slice(0, 6).map((call) => (
                <div key={call.id} className="flex flex-col gap-2 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#10201d]">{call.caller_number_last4 ? `Caller ending ${call.caller_number_last4}` : call.provider_call_id ?? call.id}</p>
                    <p className="text-sm text-[#65736f]">{formatDate(call.started_at)}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(call.status)}`}>
                    {call.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce6e3] px-4 py-6 text-sm text-[#65736f]">No active calls right now.</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Recent calls</p>
              <h3 className="mt-1 text-xl font-semibold text-[#10201d]">Latest clinic call log</h3>
            </div>
            <Link href="/calls" className="text-sm font-semibold text-[#087968] hover:text-[#066657]">
              Review all
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {data.recentCalls.length > 0 ? (
              data.recentCalls.slice(0, 6).map((call) => (
                <div key={call.id} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{call.direction === "inbound" ? "Inbound" : "Outbound"} call</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(call.status)}`}>{call.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#65736f]">{call.caller_number_last4 ? `Caller ending ${call.caller_number_last4}` : call.provider_call_id ?? call.id}</p>
                  <p className="mt-1 text-xs text-[#65736f]">{formatDate(call.started_at)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce6e3] px-4 py-6 text-sm text-[#65736f]">No recent calls yet.</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Missed calls</p>
              <h3 className="mt-1 text-xl font-semibold text-[#10201d]">Recovery queue</h3>
            </div>
            <Link href="/calls" className="text-sm font-semibold text-[#087968] hover:text-[#066657]">
              Open queue
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {data.missedCalls.length > 0 ? (
              data.missedCalls.slice(0, 6).map((call) => (
                <div key={call.id} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{call.caller_number_last4 ? `Caller ending ${call.caller_number_last4}` : call.provider_call_id ?? call.id}</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(call.recovery_status)}`}>{call.recovery_status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#65736f]">Call status: {call.status}</p>
                  <p className="mt-1 text-xs text-[#65736f]">{formatDate(call.started_at)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce6e3] px-4 py-6 text-sm text-[#65736f]">No missed calls requiring recovery.</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">SMS conversations</p>
              <h3 className="mt-1 text-xl font-semibold text-[#10201d]">Inbound and outbound texts</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {data.smsConversations.length > 0 ? (
              data.smsConversations.slice(0, 6).map((event) => (
                <div key={event.id} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{event.direction === "inbound" ? "Inbound" : "Outbound"} SMS</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(event.status)}`}>{event.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#65736f]">{event.body_preview ?? event.provider_message_id ?? "SMS event"}</p>
                  <p className="mt-1 text-xs text-[#65736f]">{formatDate(event.occurred_at)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce6e3] px-4 py-6 text-sm text-[#65736f]">No SMS conversations yet.</p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Voicemails</p>
              <h3 className="mt-1 text-xl font-semibold text-[#10201d]">Recorded messages and transcriptions</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.voicemails.length > 0 ? (
              data.voicemails.slice(0, 6).map((voicemail) => (
                <div key={voicemail.id} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#10201d]">{voicemail.provider_voicemail_id.slice(0, 12)}</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(voicemail.status)}`}>{voicemail.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#65736f]">{voicemail.summary ?? voicemail.transcript_text ?? "Voicemail captured"}</p>
                  <p className="mt-1 text-xs text-[#65736f]">{formatDate(voicemail.received_at)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#dce6e3] px-4 py-6 text-sm text-[#65736f] xl:col-span-3">
                No voicemails recorded yet.
              </p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
