import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { getPatientDetailData } from "@/lib/patients/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toneClass(tone: string) {
  if (tone === "positive") return "border-[#c8eee6] bg-[#f7fffd] text-[#087968]";
  if (tone === "warning") return "border-[#f2dfd8] bg-[#fff9f6] text-[#9a3412]";
  return "border-[#dbe6e2] bg-white text-[#52615d]";
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const { patientId } = await params;
  const data = await getPatientDetailData(user, patientId);
  const patient = data.lead;

  if (!patient) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/patients" variant="app" />

      <section className="mx-auto grid max-w-[88rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/patients" className="text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
            Back to patients
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/calls" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
              View calls
            </Link>
            <Link href="/inbox" className="rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
              Open inbox
            </Link>
          </div>
        </div>

        <article className="rounded-[34px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d] md:text-5xl">{patient.full_name}</h1>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#52615d]">
                {patient.notes ?? "This patient lead is ready for call history, SMS follow-up, and AI summary review."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Calls", data.callCount.toString()],
                ["SMS", data.smsCount.toString()],
                ["Voicemails", data.voicemailCount.toString()],
                ["Workflows", data.workflowCount.toString()],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] border border-[#edf2f0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass(patient.status === "active" ? "positive" : patient.status === "inactive" ? "warning" : "neutral")}`}>
              {patient.status}
            </span>
            <span className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#52615d]">
              {patient.source}
            </span>
            <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1.5 text-xs font-semibold text-[#087968]">
              Lead score {patient.source === "phone" ? "High intent" : "Warm lead"}
            </span>
          </div>
        </article>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#087968]">Patient timeline</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Calls, SMS, voicemails, summaries, and workflow updates</h2>
              </div>
              <span className="rounded-full border border-[#dbe6e2] bg-[#fbfdfc] px-3 py-1.5 text-xs font-semibold text-[#52615d]">
                {data.timeline.length} events
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {data.timeline.length > 0 ? (
                data.timeline.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[#10201d]">{item.title}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(item.tone)}`}>{item.kind}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#52615d]">{item.detail}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">
                      {new Date(item.timestamp).toLocaleString("en-GB")}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#dbe6e2] bg-[#fbfdfc] p-5 text-sm leading-7 text-[#65736f]">
                  No timeline activity yet. Calls, messages, voicemails, and summaries will appear here as the patient is engaged.
                </div>
              )}
            </div>
          </article>

          <aside className="grid gap-6">
            <article className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
              <p className="text-sm font-semibold text-[#087968]">AI summary</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Reception handover</h2>
              <div className="mt-5 grid gap-4">
                {[
                  ["Reason for calling", data.summary.reasonForCalling],
                  ["Clinical notes", data.summary.clinicalNotes],
                  ["Reception notes", data.summary.receptionNotes],
                  ["Recommended action", data.recommendedAction],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">{label}</p>
                    <p className="mt-2 text-sm leading-7 text-[#10201d]">{value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[32px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
              <p className="text-sm font-semibold text-[#087968]">Recovery cues</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">What reception should do next</h2>
              <div className="mt-5 grid gap-3">
                {[
                  data.summary.appointmentRecommendation,
                  data.summary.treatmentRecommendation,
                  data.summary.smsRecommendation,
                  data.summary.emailRecommendation,
                ].map((item) => (
                  <div key={item} className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-7 text-[#10201d]">
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[32px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#10201d_0%,#0f1c1a_100%)] p-6 text-white shadow-[0_24px_100px_rgba(16,33,29,0.2)]">
              <p className="text-sm font-semibold text-[#72e5d3]">Editable status</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">The live record stays calm and explainable.</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                This patient view now carries the current call history, SMS trail, voicemail evidence, and workflow state in one place so the team can move without losing context.
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
