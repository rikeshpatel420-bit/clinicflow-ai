"use client";

import { useMemo, useState } from "react";
import type { EnquiryCategory } from "@/lib/ai/logic";
import { classifyIntent, needsEscalation, recommendNextAction, scoreLead } from "@/lib/ai/logic";

type Scenario = {
  audience: string;
  label: string;
  transcript: string;
  value: number;
};

const scenarios: Scenario[] = [
  {
    audience: "Emergency",
    label: "Severe pain and swelling",
    transcript: "I've got severe tooth pain, my cheek is swelling, and I need someone to call me back today.",
    value: 280,
  },
  {
    audience: "Booking",
    label: "New hygiene appointment",
    transcript: "Hello, I'd like to book a hygiene appointment for next Tuesday afternoon if possible.",
    value: 160,
  },
  {
    audience: "Cancellation",
    label: "Move an existing appointment",
    transcript: "I need to move my appointment from Thursday to Friday morning because work changed.",
    value: 120,
  },
  {
    audience: "Quote",
    label: "Invisalign pricing question",
    transcript: "Can you tell me how much Invisalign costs and whether I need a consultation first?",
    value: 320,
  },
  {
    audience: "Complaint",
    label: "Complaint and callback request",
    transcript: "I'm unhappy about the wait last week and I'd like someone senior to call me back.",
    value: 200,
  },
  {
    audience: "After-hours",
    label: "Out-of-hours answer",
    transcript: "I'm calling after hours and I need to know if anyone can still help tonight.",
    value: 140,
  },
  {
    audience: "Human transfer",
    label: "Speak to reception",
    transcript: "Can I just speak to a receptionist now, please?",
    value: 100,
  },
];

function reasonFor(intent: EnquiryCategory, transcript: string, score: number) {
  const lower = transcript.toLowerCase();

  if (intent.toLowerCase().includes("emergency") || lower.includes("swelling") || lower.includes("severe pain")) {
    return "The caller mentioned pain and swelling, so the assistant should stay calm, ask one short safety question, and move to urgent triage.";
  }

  if (intent.toLowerCase().includes("price") || lower.includes("cost")) {
    return "This is a pricing question, so the assistant should stay general, avoid quoting exact fees, and offer a consultation.";
  }

  if (intent.toLowerCase().includes("reschedule")) {
    return "This is a scheduling change, so the assistant should confirm the new preferred time and capture the original appointment if known.";
  }

  if (intent.toLowerCase().includes("new_patient")) {
    return "This is a new patient enquiry, so the assistant should capture contact details, the reason for the visit, and preferred timing.";
  }

  if (intent.toLowerCase().includes("human") || score >= 90) {
    return "The caller wants a person, so the assistant should hand over politely without over-questioning.";
  }

  return "The assistant should acknowledge the request warmly, capture the essentials, and keep the conversation moving.";
}

export function AiPlayground() {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const activeScenario = scenarios[activeScenarioIndex];

  const evaluation = useMemo(() => {
    const intent = classifyIntent(activeScenario.transcript);
    const urgencyScore = scoreLead(intent, 12, activeScenario.value);
    const escalation = needsEscalation(intent, urgencyScore);

    return {
      escalation,
      intent,
      nextAction: recommendNextAction(intent, urgencyScore),
      reasoning: reasonFor(intent, activeScenario.transcript, urgencyScore),
      suggestedResponse:
        escalation || intent.toLowerCase().includes("emergency")
          ? "Of course — let me get this to the right person straight away."
          : intent.toLowerCase().includes("price")
            ? "Of course. Prices do vary a little, so I can get the team to call you back with the right options."
            : "Of course. I can help with that and I’ll make sure the team sees the details.",
      urgencyScore,
    };
  }, [activeScenario]);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-[30px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">Playground scenarios</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Test the receptionist before live traffic</h2>
        <p className="mt-3 text-sm leading-6 text-[#65736f]">
          Choose a scenario and see how the AI classifies the request, scores urgency, and decides whether to escalate or keep booking.
        </p>

        <div className="mt-5 grid gap-3">
          {scenarios.map((scenario, index) => {
            const active = index === activeScenarioIndex;

            return (
              <button
                key={scenario.label}
                type="button"
                onClick={() => setActiveScenarioIndex(index)}
                className={`rounded-[22px] border p-4 text-left transition ${
                  active ? "border-[#087968] bg-[#f2fbf8]" : "border-[#edf2f0] bg-[#fbfdfc] hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{scenario.audience}</p>
                    <p className="mt-1 font-semibold text-[#10201d]">{scenario.label}</p>
                  </div>
                  <span className="rounded-full border border-[#c8eee6] bg-white px-3 py-1 text-xs font-semibold text-[#087968]">Try</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5d6d68]">{scenario.transcript}</p>
              </button>
            );
          })}
        </div>
      </article>

      <article className="grid gap-4 rounded-[30px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Scenario analysis</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">{activeScenario.label}</h2>
          </div>
          <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">
            Urgency {evaluation.urgencyScore}%
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-[24px] border border-[#edf2f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Transcript</p>
            <p className="mt-2 text-sm leading-7 text-[#10201d]">{activeScenario.transcript}</p>
          </section>
          <section className="rounded-[24px] border border-[#edf2f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Reasoning</p>
            <p className="mt-2 text-sm leading-7 text-[#10201d]">{evaluation.reasoning}</p>
          </section>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[24px] border border-[#edf2f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Intent</p>
            <p className="mt-3 text-lg font-semibold text-[#10201d]">{evaluation.intent.replace(/_/g, " ")}</p>
          </article>
          <article className="rounded-[24px] border border-[#edf2f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Next action</p>
            <p className="mt-3 text-lg font-semibold text-[#10201d]">{evaluation.nextAction}</p>
          </article>
          <article className="rounded-[24px] border border-[#edf2f0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Escalation</p>
            <p className="mt-3 text-lg font-semibold text-[#10201d]">{evaluation.escalation ? "Yes" : "No"}</p>
          </article>
        </div>

        <section className="rounded-[26px] border border-[#dbe6e2] bg-[#10201d] p-5 text-white">
          <p className="text-sm font-semibold text-[#72e5d3]">Suggested response</p>
          <p className="mt-3 text-lg leading-8 text-white/88">{evaluation.suggestedResponse}</p>
        </section>
      </article>
    </section>
  );
}
