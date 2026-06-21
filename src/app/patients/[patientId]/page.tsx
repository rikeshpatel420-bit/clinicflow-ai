import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { getPatientDetailData } from "@/lib/patients/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  const patient = data.patient;

  if (!patient) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/patients" variant="app" />
      <section className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6 md:px-8">
        <Link href="/patients" className="text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Back to patients
        </Link>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#10201d]">{patient.full_name}</h1>
          <p className="mt-2 text-[0.98rem] text-[#65736f]">
            Detail placeholder ready for notes, call history, appointments, and CRM timeline.
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Email</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{patient.email ?? "Not recorded"}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Phone</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{patient.phone ?? "Not recorded"}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Status</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{patient.status}</dd>
            </div>
            <div className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <dt className="text-xs font-semibold uppercase text-[#65736f]">Source</dt>
              <dd className="mt-2 font-medium text-[#10201d]">{patient.source}</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
