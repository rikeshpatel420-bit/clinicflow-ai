import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { getCommunicationsData } from "@/lib/communications/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export default async function InboxPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const data = await getCommunicationsData(user);

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
              <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">Clinic inbox</h1>
              <p className="mt-2 text-sm text-[#65736f]">
                {data.source === "demo" ? "Demo SMS conversations with placeholder AI summaries." : "Clinic-scoped patient communication threads."}
              </p>
            </div>
            <Link href="/campaigns" className="w-fit rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20332f]">
              Campaigns
            </Link>
          </header>

          {data.emptyMessage ? (
            <EmptyState title="No clinic workspace yet" message={data.emptyMessage} actionHref="/onboarding" actionLabel="Create clinic" />
          ) : (
            <section className="rounded-lg border border-[#dce6e3] bg-white shadow-sm">
              <div className="border-b border-[#edf2f0] p-5">
                <h2 className="text-lg font-semibold text-[#10201d]">Conversation threads</h2>
              </div>
              {data.conversations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-[#f7faf9] text-[#65736f]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Thread</th>
                        <th className="px-5 py-3 font-semibold">Channel</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Follow-up</th>
                        <th className="px-5 py-3 font-semibold">Last activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf2f0]">
                      {data.conversations.map((conversation) => (
                        <tr key={conversation.id} className="hover:bg-[#fbfdfc]">
                          <td className="px-5 py-4">
                            <Link href={`/conversations/${conversation.id}`} className="font-semibold text-[#10201d] hover:text-[#087968]">
                              {conversation.subject}
                            </Link>
                            <p className="mt-1 text-xs text-[#65736f]">{conversation.ai_summary ?? "No AI summary yet"}</p>
                          </td>
                          <td className="px-5 py-4 text-[#394642]">{label(conversation.channel)}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-[#e9faf6] px-2.5 py-1 text-xs font-semibold text-[#087968]">{label(conversation.status)}</span>
                          </td>
                          <td className="px-5 py-4 text-[#394642]">{label(conversation.follow_up_state)}</td>
                          <td className="px-5 py-4 text-[#65736f]">
                            {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString("en-GB") : "No messages"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-sm text-[#65736f]">No conversations yet.</div>
              )}
            </section>
          )}
        </div>

        <aside className="rounded-lg bg-[#10201d] p-5 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">AI agent activity</p>
          <div className="mt-5 grid gap-4">
            {data.activity.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.05] p-4">
                <p className="font-semibold">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{item.meta}</p>
                <p className="mt-3 text-xs font-semibold text-[#72e5d3]">{label(item.status)}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
