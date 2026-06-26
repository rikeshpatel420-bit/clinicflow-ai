"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CommunicationsData } from "@/lib/communications/data";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function threadStateTone(state: string) {
  const lower = state.toLowerCase();
  if (lower.includes("awaiting") || lower.includes("open")) return "border-[#c8eee6] bg-[#f7fffd] text-[#087968]";
  if (lower.includes("failed")) return "border-[#f2dfd8] bg-[#fff9f6] text-[#9a3412]";
  return "border-[#dbe6e2] bg-white text-[#52615d]";
}

function threadPriorityTone(priority: string) {
  return priority === "urgent" ? "border-[#f2dfd8] bg-[#fff9f6] text-[#9a3412]" : "border-[#dbe6e2] bg-white text-[#52615d]";
}

export function SmsConversationCentre({ data }: { data: CommunicationsData }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => data.conversations[0]?.id ?? "");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return data.conversations.filter((conversation) => {
      if (!value) return true;

      const haystack = [
        conversation.subject,
        conversation.ai_summary,
        conversation.follow_up_state,
        conversation.status,
        conversation.channel,
        conversation.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [data.conversations, query]);

  const selectedConversation = filtered.find((conversation) => conversation.id === selectedId) ?? filtered[0] ?? null;
  const selectedMessages = selectedConversation ? data.messages.filter((message) => message.conversation_id === selectedConversation.id) : [];

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#087968]">SMS conversation centre</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Threads that feel like a live inbox</h2>
          </div>
          <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1.5 text-xs font-semibold text-[#087968]">
            {filtered.length} threads
          </span>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-[#52615d]">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patient, note, or status"
            className="mt-2 w-full rounded-full border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
          />
        </label>

        <div className="mt-5 grid gap-3">
          {filtered.length > 0 ? (
            filtered.map((conversation) => {
              const isSelected = conversation.id === selectedConversation?.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    isSelected ? "border-[#c8eee6] bg-[#f8fffd] shadow-sm" : "border-[#edf2f0] bg-[#fbfdfc] hover:border-[#cdd8d5] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#10201d]">{conversation.subject}</p>
                      <p className="mt-1 text-xs text-[#65736f]">{conversation.ai_summary ?? "No AI summary yet."}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${threadStateTone(conversation.follow_up_state)}`}>
                      {titleCase(conversation.follow_up_state)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${threadPriorityTone(conversation.priority)}`}>
                      {titleCase(conversation.priority)}
                    </span>
                    <span className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#52615d]">
                      {titleCase(conversation.channel)}
                    </span>
                    <span className="text-xs font-semibold text-[#65736f]">{formatDateTime(conversation.last_message_at)}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-5 text-sm leading-7 text-[#65736f]">
              No conversations match this search yet.
            </div>
          )}
        </div>
      </aside>

      <article className="grid gap-6">
        <section className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Selected thread</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">
                {selectedConversation?.subject ?? "Select a conversation"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#65736f]">
                {selectedConversation?.ai_summary ?? "Thread details, AI suggestions, and conversation history will appear here."}
              </p>
            </div>
            {selectedConversation?.patient_id ? (
              <Link href={`/patients/${selectedConversation.patient_id}`} className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                Open patient
              </Link>
            ) : null}
          </div>

          {selectedConversation ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Conversation history</p>
                <div className="mt-4 grid gap-3">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[92%] rounded-[22px] border px-4 py-3 text-sm leading-6 ${
                        message.direction === "outbound"
                          ? "ml-auto border-[#c8eee6] bg-[#f7fffd] text-[#10201d]"
                          : "border-[#edf2f0] bg-white text-[#10201d]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">
                          {titleCase(message.sender_type)} • {titleCase(message.delivery_status)}
                        </span>
                        <span className="text-xs font-semibold text-[#65736f]">{formatDateTime(message.sent_at)}</span>
                      </div>
                      <p className="mt-2">{message.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[22px] border border-dashed border-[#c8eee6] bg-[#f8fffd] p-4 text-sm leading-7 text-[#52615d]">
                  <span className="font-semibold text-[#087968]">Typing indicator</span> The inbox is ready for live SMS replies, reply drafts, and staff handover notes.
                </div>
              </div>

              <div className="grid gap-4">
                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">AI suggested reply</p>
                  <p className="mt-3 text-sm leading-7 text-[#10201d]">
                    {selectedConversation.follow_up_state === "awaiting_reply"
                      ? "Thanks for replying. We can help with that today. Would you like us to call you back or help you book online?"
                      : "Hi, thanks for calling. Sorry we missed you. Reply YES and we'll call you back."}
                  </p>
                </section>

                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Quick templates</p>
                  <div className="mt-3 grid gap-2">
                    {[
                      "Thanks for your message. We can help with that today.",
                      "Would you like a callback or an online booking link?",
                      "Please reply YES and we'll call you back.",
                      "Thanks, we have logged this for the reception team.",
                    ].map((template) => (
                      <button
                        key={template}
                        type="button"
                        className="rounded-[18px] border border-[#dbe6e2] bg-white px-4 py-3 text-left text-sm leading-6 text-[#10201d] shadow-sm transition hover:border-[#c8eee6] hover:bg-[#f8fffd]"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">Patient timeline</p>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-[18px] border border-[#dbe6e2] bg-white p-4 text-sm leading-6 text-[#10201d]">
                      {selectedConversation.subject}
                    </div>
                    <div className="rounded-[18px] border border-[#dbe6e2] bg-white p-4 text-sm leading-6 text-[#10201d]">
                      {selectedConversation.ai_summary ?? "No AI summary yet."}
                    </div>
                    <div className="rounded-[18px] border border-[#dbe6e2] bg-white p-4 text-sm leading-6 text-[#10201d]">
                      {selectedConversation.last_message_at ? `Last activity ${formatDateTime(selectedConversation.last_message_at)}` : "No recent activity"}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[26px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-6 text-sm leading-7 text-[#65736f]">
              No conversation selected yet. Add demo data or wait for a Twilio SMS thread to arrive.
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[26px] border border-[#dbe6e2] bg-white p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Awaiting replies</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">
              {filtered.filter((item) => item.follow_up_state === "awaiting_reply").length}
            </p>
          </article>
          <article className="rounded-[26px] border border-[#dbe6e2] bg-white p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Response state</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{titleCase(selectedConversation?.follow_up_state ?? "scheduled")}</p>
          </article>
          <article className="rounded-[26px] border border-[#dbe6e2] bg-white p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#087968]">Last updated</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">{formatDateTime(selectedConversation?.last_message_at ?? null)}</p>
          </article>
        </section>
      </article>
    </section>
  );
}
