import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { createPatientLeadAction } from "./actions";

function errorMessage(value?: string) {
  if (value === "missing-name") return "Enter a patient or lead name.";
  if (value === "save-failed") return "Could not save this patient lead. Please try again.";
  return null;
}

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  const params = await searchParams;
  const error = errorMessage(params?.error);

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6 py-12 text-[#17211f]">
      <section className="w-full max-w-2xl rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <Link href="/patients" className="text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Back to patients
        </Link>
        <div className="mt-8">
          <p className="text-sm font-semibold text-[#087968]">Patient CRM</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Add patient</h1>
          <p className="mt-3 leading-7 text-[#65736f]">
            Add a clinic-scoped patient lead. Contact details stay attached to the lead summary until the dedicated patient record table is enabled.
          </p>
          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}
        </div>

        <form action={createPatientLeadAction} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Full name
            <input
              name="fullName"
              required
              type="text"
              placeholder="Amelia Carter"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#394642]">
              Email
              <input
                name="email"
                type="email"
                placeholder="patient@example.com"
                className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#394642]">
              Phone
              <input
                name="phone"
                type="tel"
                placeholder="+44 7700 900123"
                className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Enquiry note
            <textarea
              name="enquiry"
              placeholder="Implant consultation enquiry, emergency toothache, hygiene recall..."
              className="min-h-28 rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
          >
            Save patient lead
          </button>
        </form>
      </section>
    </main>
  );
}
