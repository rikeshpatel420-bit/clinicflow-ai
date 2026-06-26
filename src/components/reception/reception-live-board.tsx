"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReceptionConsoleData } from "@/lib/reception/data";

function formatRelativeTime(value: string | null, now: number) {
  if (!value) {
    return "Just now";
  }

  if (!now) {
    return "Just now";
  }

  const diff = Math.max(0, now - new Date(value).getTime());
  const minutes = Math.max(1, Math.round(diff / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ago`;
}

function formatElapsed(startedAt: string | null, now: number) {
  if (!startedAt) {
    return "0:00";
  }

  if (!now) {
    return "0:00";
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function badgeClass(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("urgent") || lower.includes("frustrated") || lower.includes("high")) {
    return "bg-[#fff3ed] text-[#9a3412] border-[#f5d0c5]";
  }

  if (lower.includes("ready") || lower.includes("positive") || lower.includes("recovered")) {
    return "bg-[#ecfdf5] text-[#047857] border-[#b7ebd0]";
  }

  return "bg-[#eef4f2] text-[#52615d] border-[#dbe6e2]";
}

function metricTone(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("revenue") || lower.includes("booked") || lower.includes("answered") || lower.includes("sms sent")) {
    return "border-[#c8eee6] bg-white";
  }
  if (lower.includes("missed") || lower.includes("response time")) {
    return "border-[#f2dfd8] bg-white";
  }
  return "border-[#dbe6e2] bg-white";
}

function eventTone(tone: "positive" | "neutral" | "warning") {
  if (tone === "positive") return "border-[#c8eee6] bg-[#f8fffd]";
  if (tone === "warning") return "border-[#f2dfd8] bg-[#fff9f6]";
  return "border-[#dbe6e2] bg-white";
}

export function ReceptionLiveBoard({ initialData }: { initialData: ReceptionConsoleData }) {
  const [data, setData] = useState(initialData);
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const initialTick = window.setTimeout(() => setClock(Date.now()), 0);
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/ai/reception", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const nextData = (await response.json()) as ReceptionConsoleData;
        if (mounted) {
          setData(nextData);
        }
      } catch {
        // Keep the last successful snapshot visible if the refresh fails.
      }
    };

    const interval = window.setInterval(refresh, 15000);
    refresh();

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const currentCall = data.currentCall;
  const elapsed = useMemo(() => formatElapsed(currentCall?.recordedAt ?? currentCall?.completedAt ?? null, clock), [clock, currentCall?.recordedAt, currentCall?.completedAt]);
  const metricColumns = data.metrics.slice(0, 6);

  return (
    <div className="grid gap-6">
      <section className="rounded-[34px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold text-[#087968]">AI Reception Console</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d] md:text-5xl">
              Live call handling, transcription, and recovery in one calm command surface.
            </h1>
            <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-[#52615d]">
              Watch the clinic call flow update in real time as calls arrive, summaries are drafted, voicemails are transcribed, and SMS recovery threads move toward a booking.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-[#52615d] lg:text-right">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7b76]">Last refresh</p>
              <p className="mt-1 text-base font-semibold text-[#10201d]">{formatRelativeTime(data.lastUpdatedAt, clock)}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link href="/calls" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                Call log
              </Link>
              <Link href="/inbox" className="rounded-full bg-[#087968] px-4 py-2.5 font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
                Open inbox
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metricColumns.map((metric) => (
            <article key={metric.label} className={`rounded-[24px] border p-5 shadow-sm ${metricTone(metric.label)}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">{metric.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Live caller</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">
                {currentCall?.callerLabel ?? "Awaiting the next patient call"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">
                {currentCall?.existingPatientStatus ?? "No live caller yet"} {currentCall?.isNewPatient ? "• New patient" : "• Existing patient"}
              </p>
            </div>
            <div className="rounded-full border border-[#c8eee6] bg-[#f2fbf8] px-3 py-1.5 text-sm font-semibold text-[#087968]">
              {currentCall?.hasLiveCall ? "Live" : "Ready"}
            </div>
          </div>

          {currentCall ? (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Caller number", currentCall.callerNumberLast4 ? `Ending ${currentCall.callerNumberLast4}` : "Protected"],
                ["Timer", currentCall.hasLiveCall ? elapsed : formatRelativeTime(currentCall.recordedAt, clock)],
                  ["AI confidence", `${currentCall.aiConfidence}%`],
                  ["Sentiment", currentCall.currentSentiment],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7b76]">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-[#10201d]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Live transcription</p>
                  <p className="mt-3 text-[0.98rem] leading-7 text-[#10201d]">{currentCall.liveTranscription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeClass(currentCall.appointmentCategory)}`}>
                      {currentCall.appointmentCategory}
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeClass(currentCall.existingPatientStatus)}`}>
                      {currentCall.existingPatientStatus}
                    </span>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeClass(currentCall.patientIntent)}`}>
                      {currentCall.patientIntent.replace(/_/g, " ")}
                    </span>
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Reception guidance</p>
                  <dl className="mt-3 grid gap-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#52615d]">Suggested duration</dt>
                      <dd className="font-semibold text-[#10201d]">{currentCall.suggestedDurationMinutes} mins</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#52615d]">Suggested clinician</dt>
                      <dd className="font-semibold text-[#10201d]">{currentCall.suggestedClinician}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#52615d]">Suggested treatment</dt>
                      <dd className="font-semibold text-[#10201d]">{currentCall.suggestedTreatmentType}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm leading-6 text-[#52615d]">{currentCall.suggestedResponse}</p>
                </section>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Emergency detection</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentCall.emergencyKeywords.length > 0 ? (
                      currentCall.emergencyKeywords.map((keyword) => (
                        <span key={keyword} className="rounded-full border border-[#f2dfd8] bg-[#fff9f6] px-3 py-1.5 text-xs font-semibold text-[#9a3412]">
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#52615d]">
                        No emergency keywords detected
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#52615d]">
                    NHS vs Private likelihood: <span className="font-semibold text-[#10201d]">{currentCall.nhsLikelihood}% NHS</span> /{" "}
                    <span className="font-semibold text-[#10201d]">{currentCall.privateLikelihood}% private</span>
                  </p>
                </section>

                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Recovery state</p>
                  <p className="mt-3 text-[0.98rem] leading-7 text-[#10201d]">
                    {currentCall.recoveryStatus === "sms_sent"
                      ? "SMS recovery has been sent and is waiting for a patient reply."
                      : currentCall.recoveryStatus === "recovered"
                        ? "The patient has been recovered and the handover is complete."
                        : currentCall.recoveryStatus === "booked"
                          ? "The patient is booked and the diary should be updated."
                          : "Recovery is ready to move into the next step."}
                  </p>
                  <div className="mt-4 rounded-[20px] border border-[#dbe6e2] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Suggested next step</p>
                    <p className="mt-2 text-sm leading-6 text-[#10201d]">{currentCall.suggestedResponse}</p>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[26px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-6 text-sm leading-7 text-[#65736f]">
              No active call is currently streaming. The console will update automatically as Twilio events arrive.
            </div>
          )}
        </article>

        <aside className="grid gap-6">
          <section className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Voicemail AI</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Transcribed voicemail and callback guidance</h2>
            {data.voicemail ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Summary</p>
                  <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.voicemail.summary}</p>
                </div>
                <div className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Transcript</p>
                  <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.voicemail.transcript ?? "No transcript available yet."}</p>
                </div>
                <div className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Callback recommendation</p>
                  <p className="mt-2 text-sm leading-7 text-[#10201d]">{data.voicemail.callbackRecommendation}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${badgeClass(data.voicemail.urgency)}`}>
                    {data.voicemail.urgency} urgency
                  </span>
                  {data.voicemail.recordingUrl ? (
                    <span className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#52615d]">
                      {data.voicemail.recordingUrl}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#65736f]">Voicemail transcripts and callback recommendations will appear here after a voicemail is captured.</p>
            )}
          </section>

          <section className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Missed-call engine</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Recovery at a glance</h2>
            <div className="mt-5 grid gap-3">
              {data.missedCallEngine.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between gap-4 rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#10201d]">{metric.label}</p>
                    <p className="mt-1 text-xs text-[#65736f]">{metric.note}</p>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-[#10201d]">{metric.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Live events</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Recent real-time activity</h2>
            <div className="mt-5 grid gap-3">
              {data.recentEvents.map((event) => (
                <article key={event.id} className={`rounded-[22px] border p-4 ${eventTone(event.tone)}`}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[#10201d]">{event.label}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{formatRelativeTime(event.timestamp, clock)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#52615d]">{event.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
