import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteHeader } from "@/components/navigation/site-header";
import { SmsConversationCentre } from "@/components/communications/sms-conversation-centre";
import { getCommunicationsData } from "@/lib/communications/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  const data = await getCommunicationsData(user);

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/inbox" variant="app" />

      <section className="mx-auto grid max-w-[88rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d] md:text-5xl">SMS conversation centre</h1>
          <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-[#52615d]">
            Keep every missed-call text back, reply draft, and conversation thread visible in one premium inbox experience.
          </p>
        </header>

        {data.emptyMessage ? (
          <EmptyState title="No clinic workspace yet" message={data.emptyMessage} actionHref="/onboarding" actionLabel="Create clinic" />
        ) : null}

        {data.error ? (
          <section className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {data.error}
          </section>
        ) : null}

        <SmsConversationCentre data={data} />
      </section>
    </main>
  );
}
