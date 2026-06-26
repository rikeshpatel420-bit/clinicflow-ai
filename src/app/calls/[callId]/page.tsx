import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { CallDetailLivePanel } from "@/components/calls/call-detail-live-panel";
import { getCallDetailData } from "@/lib/calls/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const { callId } = await params;
  const data = await getCallDetailData(user, callId);
  if (!data.call) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/calls" variant="app" />

      <section className="mx-auto grid max-w-[88rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/calls" className="text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
            Back to calls
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/patients" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
              Patients
            </Link>
            <Link href="/inbox" className="rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
              Inbox
            </Link>
          </div>
        </div>
        <CallDetailLivePanel callId={callId} initialData={data} />
      </section>
    </main>
  );
}
