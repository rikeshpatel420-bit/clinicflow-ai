import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { TwilioStatusStrip } from "@/components/dashboard/twilio-status-strip";
import { ReceptionLiveBoard } from "@/components/reception/reception-live-board";
import { ReceptionSummaryForm } from "@/components/reception/reception-summary-form";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getReceptionConsoleData } from "@/lib/reception/data";
import { getTwilioSetupHealthForClinic } from "@/lib/twilio/health";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function noticeFromStatus(status?: string) {
  if (status === "saved") {
    return { tone: "success" as const, text: "AI summary saved to the audit trail." };
  }

  if (status === "error") {
    return { tone: "error" as const, text: "The AI summary could not be saved." };
  }

  return null;
}

export default async function AiCommandPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  const params = await searchParams;

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  let membership = null;
  if (isSupabaseConfigured && user) {
    membership = await getActiveClinicMembershipForUser(user);
    if (!membership) {
      redirect("/onboarding");
    }
  }

  const data = await getReceptionConsoleData(user);
  const notice = noticeFromStatus(params?.status);
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto =
    requestHeaders.get("x-forwarded-proto") ?? (forwardedHost && /localhost|127\.0\.0\.1/.test(forwardedHost) ? "http" : "https");
  const baseUrl = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const twilioHealth = membership ? await getTwilioSetupHealthForClinic(membership.clinic_id, { baseUrl }) : null;

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/ai" variant="app" />

      <section className="mx-auto grid max-w-[88rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {notice ? (
          <section
            className={`rounded-[24px] border px-4 py-3 text-sm font-medium ${
              notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {notice.text}
          </section>
        ) : null}

        {twilioHealth ? <TwilioStatusStrip health={twilioHealth} /> : null}

        <ReceptionLiveBoard initialData={data} />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <ReceptionSummaryForm draft={data.summary} />

          <section className="grid gap-6">
            <article className="rounded-[30px] border border-[#dbe6e2] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
              <p className="text-sm font-semibold text-[#087968]">Reception operating guidance</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#10201d]">Premium triage, booking, and follow-up cues</h2>
              <div className="mt-5 grid gap-4">
                {[
                  "Keep urgent enquiries visible until a clinician has confirmed the next step.",
                  "Use SMS for missed-call recovery and short callback coordination.",
                  "Escalate emergency language and severe pain to the senior clinician queue.",
                  "Preserve a concise audit trail so reception can hand over cleanly between shifts.",
                ].map((item) => (
                  <div key={item} className="rounded-[22px] border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-7 text-[#10201d]">
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-[#dbe6e2] bg-[linear-gradient(180deg,#10201d_0%,#0f1c1a_100%)] p-6 text-white shadow-[0_24px_100px_rgba(16,33,29,0.2)]">
              <p className="text-sm font-semibold text-[#72e5d3]">Live recovery posture</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Every missed call becomes a structured workflow.</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                The console keeps live transcription, patient summary, voicemail interpretation, and follow-up drafting visible at the same time so reception never has to switch mental context.
              </p>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
