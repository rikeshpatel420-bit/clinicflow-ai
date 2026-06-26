"use client";

import { useEffect, useState } from "react";
import { CallStatusBadge, RecoveryStatusBadge } from "@/app/calls/status-badge";
import type { CallDetailData } from "@/lib/calls/data";

function sectionTone(value: string) {
  if (value === "positive") return "border-[#c8eee6] bg-[#f7fffd] text-[#087968]";
  if (value === "warning") return "border-[#f2dfd8] bg-[#fff9f6] text-[#9a3412]";
  return "border-[#dbe6e2] bg-white text-[#52615d]";
}

export function CallDetailLivePanel({ callId, initialData }: { callId: string; initialData: CallDetailData }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/live/calls?callId=${encodeURIComponent(callId)}`, { cache: "no-store" });
        if (!response.ok) return;
        const nextData = (await response.json()) as CallDetailData;
        if (mounted) {
          setData(nextData);
        }
      } catch {
        // Keep the last successful call snapshot visible if refresh fails.
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 8000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [callId]);

  const call = data.call;
  if (!call) {
    return (
      <div className="rounded-[26px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-6 text-sm leading-7 text-[#65736f]">
        No call record is available right now.
      </div>
    );
  }

  return (
    <>
      <article className="rounded-[34px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d] md:text-5xl">
              {call.direction === "inbound" ? "Inbound call" : "Outbound call"}
            </h1>
            <p className="mt-3 text-[0.98rem] leading-7 text-[#52615d]">{data.recommendedAction}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CallStatusBadge status={call.status} />
            <RecoveryStatusBadge status={call.recovery_status} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Caller", call.callerLabel],
            ["Clinic number", call.clinic_number ?? "Not recorded"],
            ["Started", new Date(call.started_at).toLocaleString("en-GB")],
            ["Duration", call.duration_seconds ? `${call.duration_seconds}s` : "No duration"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-[#edf2f0] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
              <p className="mt-2 text-lg font-semibold text-[#10201d]">{value}</p>
            </div>
          ))}
        </div>
      </article>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="grid gap-6">
          <div className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">OpenAI summary</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Structured receptionist handover</h2>
            {data.aiSummary ? (
              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Urgency", `${data.aiSummary.urgencyScore}/100`],
                    ["Tone", data.aiSummary.responseTone.replace(/_/g, " ")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{label}</p>
                      <p className="mt-2 text-lg font-semibold text-[#10201d]">{value}</p>
                    </div>
                  ))}
                </div>
                {[
                  ["Patient summary", data.aiSummary.patientSummary],
                  ["Clinical summary", data.aiSummary.clinicalSummary],
                  ["Reception notes", data.aiSummary.receptionNotes],
                  ["Appointment recommendation", data.aiSummary.appointmentRecommendation],
                  ["Follow-up recommendation", data.aiSummary.followUpRecommendation],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{label}</p>
                    <p className="mt-2 text-sm leading-7 text-[#10201d]">{value}</p>
                  </div>
                ))}
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">
                  Refreshed {data.aiSummaryGeneratedAt ? new Date(data.aiSummaryGeneratedAt).toLocaleString("en-GB") : "just now"}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-5 text-sm leading-7 text-[#65736f]">
                OpenAI summary will appear here once the call has enough live context.
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Transcript and recovery</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">What happened on the call</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Lead summary</p>
                <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.lead?.enquiry_summary ?? "No enquiry summary recorded yet."}</p>
              </div>
              <div className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">AI transcript</p>
                <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.transcript?.transcript_text ?? "No transcript available yet."}</p>
              </div>
              <div className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Recommended action</p>
                <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.recommendedAction}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${sectionTone(call.status === "answered" || call.status === "recovered" ? "positive" : call.status === "missed" || call.status === "voicemail" ? "warning" : "neutral")}`}>
                  {call.status}
                </span>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${sectionTone(call.recovery_status === "recovered" || call.recovery_status === "booked" ? "positive" : call.recovery_status === "failed" ? "warning" : "neutral")}`}>
                  {call.recovery_status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>
        </article>

        <aside className="grid gap-6">
          <article className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Recovery workflow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Next step visibility</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-7 text-[#10201d]">
                {call.recovery_next_action ?? "No recovery action queued yet."}
              </div>
              <div className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Workflow state</p>
                <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.workflow?.state.replace(/_/g, " ") ?? "Not started"}</p>
              </div>
              <div className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Lead value</p>
                <p className="mt-2 text-sm leading-7 text-[#10201d]">
                  {data.lead?.estimated_value_pence ? `£${(data.lead.estimated_value_pence / 100).toLocaleString("en-GB")}` : "Not recorded"}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">SMS thread</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Recovery text messages</h2>
            <div className="mt-5 grid gap-3">
              {data.smsEvents.length > 0 ? (
                data.smsEvents.map((sms) => (
                  <div key={sms.id} className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[#10201d]">{sms.direction === "outbound" ? "Outbound" : "Inbound"}</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{sms.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#52615d]">{sms.body_preview ?? "SMS event"}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">
                      {new Date(sms.occurred_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-4 text-sm leading-7 text-[#65736f]">
                  No SMS events linked to this call yet.
                </div>
              )}
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
