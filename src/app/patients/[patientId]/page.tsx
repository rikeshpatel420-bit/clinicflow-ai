import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { PatientDetailLivePanel } from "@/components/patients/patient-detail-live-panel";
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
  if (!data.lead) {
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
        <PatientDetailLivePanel patientId={patientId} initialData={data} />
      </section>
    </main>
  );
}
