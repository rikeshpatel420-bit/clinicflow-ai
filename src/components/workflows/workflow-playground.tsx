"use client";

import { useMemo, useState } from "react";
import { workflowDemo } from "@/lib/workflows/data";

type WorkflowScenario = {
  booking: string;
  crm: string;
  decision: string;
  endState: string;
  notification: string;
  question: string;
  title: string;
};

const workflowScenarios: WorkflowScenario[] = [
  {
    booking: "Offer the earliest appropriate emergency slot and flag same-day triage.",
    crm: "Create a high-priority CRM task and link it to the live call.",
    decision: "Urgent dental emergency with pain and swelling.",
    endState: "Escalated to the senior clinician queue.",
    notification: "Notify reception and the duty clinician immediately.",
    question: "Is this a severe pain or swelling case?",
    title: "Emergency call",
  },
  {
    booking: "Offer a consultation window and capture preferred visit time.",
    crm: "Create a lead record and tag it for quote follow-up.",
    decision: "New patient asking for an estimate and service details.",
    endState: "Follow-up task queued for the team.",
    notification: "Send the quote team an internal alert.",
    question: "What service are they asking about?",
    title: "Quote request",
  },
  {
    booking: "Move the appointment and suggest a replacement slot.",
    crm: "Update the existing patient record and appointment note.",
    decision: "Cancellation or reschedule request.",
    endState: "Diary updated and callback scheduled.",
    notification: "Tell the reception team to confirm the new slot.",
    question: "Do we know the original appointment time?",
    title: "Cancellation / reschedule",
  },
];

const steps = ["Question", "Decision", "Action", "Notification", "Booking", "CRM updates", "End state"] as const;

export function WorkflowPlayground() {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const active = workflowScenarios[activeScenarioIndex];

  const timeline = useMemo(
    () => [
      { detail: active.question, title: "Question" },
      { detail: active.decision, title: "Decision" },
      { detail: "Execute the selected profile workflow without custom code.", title: "Action" },
      { detail: active.notification, title: "Notification" },
      { detail: active.booking, title: "Booking" },
      { detail: active.crm, title: "CRM updates" },
      { detail: active.endState, title: "End state" },
    ],
    [active],
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-[30px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <p className="text-sm font-semibold text-[#087968]">Workflow testing</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Visual workflow playground</h2>
        <p className="mt-3 text-sm leading-6 text-[#65736f]">
          Test how the platform moves from a question through to actions, notifications, booking, CRM updates, and the final state.
        </p>

        <div className="mt-5 grid gap-3">
          {workflowScenarios.map((scenario, index) => {
            const activeChoice = index === activeScenarioIndex;
            return (
              <button
                key={scenario.title}
                type="button"
                onClick={() => setActiveScenarioIndex(index)}
                className={`rounded-[22px] border p-4 text-left transition ${
                  activeChoice ? "border-[#087968] bg-[#f2fbf8]" : "border-[#edf2f0] bg-[#fbfdfc] hover:bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Scenario</p>
                <p className="mt-1 font-semibold text-[#10201d]">{scenario.title}</p>
                <p className="mt-3 text-sm leading-6 text-[#5d6d68]">{scenario.question}</p>
              </button>
            );
          })}
        </div>
      </article>

      <article className="rounded-[30px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Workflow trace</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">{active.title}</h2>
          </div>
          <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">
            {workflowDemo.workflows[activeScenarioIndex % workflowDemo.workflows.length]?.status ?? "active"}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {timeline.map((item, index) => (
            <div key={item.title} className="grid gap-3 rounded-[24px] border border-[#edf2f0] bg-white p-4 sm:grid-cols-[160px_1fr] sm:items-center">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[#10201d] text-xs font-semibold text-white">{index + 1}</span>
                <p className="font-semibold text-[#10201d]">{steps[index]}</p>
              </div>
              <p className="text-sm leading-6 text-[#5d6d68]">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[26px] border border-[#dbe6e2] bg-[#10201d] p-5 text-white">
          <p className="text-sm font-semibold text-[#72e5d3]">End result</p>
          <p className="mt-3 text-lg leading-8 text-white/88">{active.endState}</p>
        </div>
      </article>
    </section>
  );
}
