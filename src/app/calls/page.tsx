import Link from "next/link";
import { redirect } from "next/navigation";
import { getCallListData } from "@/lib/calls/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/navigation/site-header";
import { addDemoCallAction } from "./actions";
import { CallStatusBadge, RecoveryStatusBadge } from "./status-badge";

export const dynamic = "force-dynamic";

function demoMessage(value?: string) {
  if (value === "added")
    return { text: "Demo missed call, recovery workflow, and SMS activity were added to the clinic call log.", tone: "success" as const };
  if (value === "error") return { text: "Could not add the demo call. Please try again.", tone: "error" as const };
  if (value === "not-authorised") return { text: "Only clinic owners and admins can add demo calls.", tone: "error" as const };
  return null;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const data = await getCallListData(user);
  const params = await searchParams;
  const notice = demoMessage(params?.demo);
  const summaryCards = [
    { label: "Total calls", value: data.calls.length },
    { label: "Missed", value: data.calls.filter((call) => call.status === "missed").length },
    { label: "Recovered", value: data.calls.filter((call) => call.status === "recovered").length },
    { label: "Answered", value: data.calls.filter((call) => call.status === "answered").length },
    { label: "Recovery queued", value: data.calls.filter((call) => call.recovery_status === "queued").length },
  ];

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/calls" variant="app" />
      <section className="mx-auto grid w-full max-w-[88rem] gap-6 px-4 py-8 sm:px-6 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">Calls</h1>
            <p className="mt-2 text-sm text-[#65736f]">
              {data.source === "demo" ? "Using demo fallback calls until Supabase is configured." : "Clinic-scoped call records from Supabase."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.canAddDemoCall ? (
              <form action={addDemoCallAction}>
                <button
                  type="submit"
                  className="rounded-md bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#066657] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087968]"
                >
                  Add demo call
                </button>
              </form>
            ) : null}
            <Link
              href="/dashboard"
              className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#9db2ad]"
            >
              Dashboard
            </Link>
            <Link
              href="/patients"
              className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20332f]"
            >
              Patients
            </Link>
          </div>
        </header>

        {data.error ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {data.error}
          </section>
        ) : null}

        {notice ? (
          <section
            className={`rounded-lg border p-4 text-sm font-medium ${
              notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {notice.text}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-5">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-lg border border-[#dce6e3] bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-[#65736f]">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#10201d]">{card.value}</p>
            </article>
          ))}
        </section>

        {data.emptyMessage ? (
          <section className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#10201d]">No clinic workspace yet</h2>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">{data.emptyMessage}</p>
            <Link
              href="/onboarding"
              className="mt-5 inline-flex rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
            >
              Create clinic
            </Link>
          </section>
        ) : (
          <section className="rounded-lg border border-[#dce6e3] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#edf2f0] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#10201d]">Call log</h2>
                <p className="mt-1 text-sm text-[#65736f]">Provider-neutral call records ready for the Twilio phase.</p>
              </div>
              <span className="w-fit rounded-md border border-[#cdd8d5] px-3 py-2 text-sm font-semibold">
                {data.calls.filter((call) => call.status === "missed").length} missed
              </span>
            </div>
            {data.calls.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="bg-[#f7faf9] text-[#65736f]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Call</th>
                      <th className="px-5 py-3 font-semibold">Caller</th>
                      <th className="px-5 py-3 font-semibold">Intent</th>
                      <th className="px-5 py-3 font-semibold">Urgency</th>
                      <th className="px-5 py-3 font-semibold">Transcript</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Recovery</th>
                      <th className="px-5 py-3 font-semibold">Duration</th>
                      <th className="px-5 py-3 font-semibold">Started</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f0]">
                    {data.calls.map((call) => (
                      <tr key={call.id} className="hover:bg-[#fbfdfc]">
                        <td className="px-5 py-4">
                          <Link href={`/calls/${call.id}`} className="font-semibold text-[#10201d] hover:text-[#087968]">
                            {call.direction === "inbound" ? "Inbound call" : "Outbound call"}
                          </Link>
                          <p className="mt-1 text-xs text-[#65736f]">{call.leadSummary ?? "No linked enquiry summary"}</p>
                        </td>
                        <td className="px-5 py-4 text-[#65736f]">
                          <span className="font-medium text-[#394642]">{call.callerLabel}</span>
                          <span className="mt-1 block text-xs">
                            {call.caller_number_last4 ? `Ending ${call.caller_number_last4}` : "Number protected"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#394642]">
                          <span className="inline-flex rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">
                            {call.intentLabel ?? "Unclear"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#394642]">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${call.urgencyScore && call.urgencyScore >= 90 ? "border-[#f2dfd8] bg-[#fff9f6] text-[#9a3412]" : "border-[#dbe6e2] bg-white text-[#52615d]"}`}>
                            {call.urgencyScore ? `${call.urgencyScore}/100` : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#65736f]">
                          <p className="max-w-[22rem] text-xs leading-6 text-[#52615d]">{call.transcriptPreview ?? "No transcript captured yet."}</p>
                        </td>
                        <td className="px-5 py-4">
                          <CallStatusBadge status={call.status} />
                        </td>
                        <td className="px-5 py-4">
                          <RecoveryStatusBadge status={call.recovery_status} />
                        </td>
                        <td className="px-5 py-4 text-[#394642]">
                          {call.duration_seconds ? `${call.duration_seconds}s` : "No duration"}
                        </td>
                        <td className="px-5 py-4 text-[#65736f]">
                          {new Date(call.started_at).toLocaleString("en-GB")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm leading-6 text-[#65736f]">
                No calls yet. Owners and admins can add a demo call to test the recovery workflow.
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
