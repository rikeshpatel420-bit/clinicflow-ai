import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getConversationDetailData } from "@/lib/communications/data";
import { getRecoveryData, formatCurrency } from "@/lib/recovery/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const { conversationId } = await params;
  const data = await getConversationDetailData(user, conversationId);
  const recovery = await getRecoveryData(user);
  if (!data.conversation) notFound();
  const recoveryItem = recovery.opportunities.find((item) => item.patient_id === data.conversation?.patient_id);

  return (
    <main className="min-h-screen bg-[#eef4f2] px-5 py-8 text-[#17211f] md:px-8">
      <section className="mx-auto grid max-w-5xl gap-6">
        <Link href="/inbox" className="text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Back to inbox
        </Link>
        <header className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#10201d]">{data.conversation.subject}</h1>
          <p className="mt-3 leading-7 text-[#65736f]">{data.conversation.ai_summary ?? "Placeholder AI summary will appear here."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[data.conversation.channel, data.conversation.status, data.conversation.follow_up_state].map((item) => (
              <span key={item} className="rounded-md bg-[#e9faf6] px-2.5 py-1 text-xs font-semibold text-[#087968]">
                {label(item)}
              </span>
            ))}
          </div>
          {recoveryItem ? (
            <div className="mt-5 rounded-lg border border-[#c8eee6] bg-[#f2fffc] p-4">
              <p className="text-sm font-semibold text-[#087968]">Recovery stage: {label(recoveryItem.stage)}</p>
              <p className="mt-2 text-sm text-[#65736f]">
                Priority {recoveryItem.priority_score}, estimated value {formatCurrency(recoveryItem.estimated_revenue_pence)}.
              </p>
            </div>
          ) : null}
        </header>

        <section className="grid gap-4">
          {data.messages.length > 0 ? (
            data.messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-lg border p-5 shadow-sm ${
                  message.direction === "outbound" ? "border-[#c8eee6] bg-[#f2fffc]" : "border-[#dce6e3] bg-white"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-[#10201d]">{label(message.sender_type)}</p>
                  <p className="text-sm text-[#65736f]">{new Date(message.sent_at).toLocaleString("en-GB")}</p>
                </div>
                <p className="mt-4 leading-7 text-[#394642]">{message.body}</p>
                <p className="mt-3 text-xs font-semibold text-[#087968]">{label(message.delivery_status)}</p>
              </article>
            ))
          ) : (
            <article className="rounded-lg border border-[#dce6e3] bg-white p-6 text-sm text-[#65736f] shadow-sm">
              No messages yet. SMS conversation history will appear here.
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
