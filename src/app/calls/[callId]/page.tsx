import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCallDetailData } from "@/lib/calls/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { CallStatusBadge, RecoveryStatusBadge } from "../status-badge";

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
  const call = data.call;

  if (!call) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/calls" variant="app" />
      <section className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6 md:px-8">
        <Link href="/calls" className="text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Back to calls
        </Link>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#10201d]">
                {call.direction === "inbound" ? "Inbound call" : "Outbound call"}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <CallStatusBadge status={call.status} />
              <RecoveryStatusBadge status={call.recovery_status} />
            </div>
          </div>

          <p className="mt-4 text-[0.98rem] leading-7 text-[#65736f]">
            Call detail placeholder ready for transcripts, recovery activity, notes, and future Twilio metadata.
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Caller</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{call.callerLabel}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Clinic number</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{call.clinic_number ?? "Not recorded"}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Started</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{new Date(call.started_at).toLocaleString("en-GB")}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Duration</dt>
              <dd className="mt-2 font-medium text-[#10201d]">
                {call.duration_seconds ? `${call.duration_seconds}s` : "No duration"}
              </dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Recovery next action</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{call.recovery_next_action ?? "No action queued"}</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
