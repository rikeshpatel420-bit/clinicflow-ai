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

export default async function CampaignsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const data = await getCommunicationsData(user);

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">Campaigns</h1>
            <p className="mt-2 text-sm text-[#65736f]">Outbound campaign planning only. No real automation executes yet.</p>
          </div>
          <Link href="/inbox" className="w-fit rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#9db2ad]">
            Inbox
          </Link>
        </header>

        {data.emptyMessage ? (
          <EmptyState title="No clinic workspace yet" message={data.emptyMessage} actionHref="/onboarding" actionLabel="Create clinic" />
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            {data.campaigns.length > 0 ? (
              data.campaigns.map((campaign) => (
                <article key={campaign.id} className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-[#10201d]">{campaign.name}</h2>
                    <span className="rounded-md bg-[#e9faf6] px-2.5 py-1 text-xs font-semibold text-[#087968]">{label(campaign.status)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#65736f]">{campaign.message_template}</p>
                  <dl className="mt-6 grid gap-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#65736f]">Audience</dt>
                      <dd className="font-semibold text-[#10201d]">{label(campaign.audience)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#65736f]">Follow-up</dt>
                      <dd className="font-semibold text-[#10201d]">{label(campaign.follow_up_state)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            ) : (
              <EmptyState title="No campaigns yet" message="Draft campaigns will appear here before any automation is enabled." />
            )}
          </section>
        )}
      </section>
    </main>
  );
}
