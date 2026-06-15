import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function NewPatientPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

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
            Placeholder form ready for a server action once patient creation permissions and validation are added.
          </p>
        </div>

        <form className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Full name
            <input
              type="text"
              placeholder="Amelia Carter"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#394642]">
              Email
              <input
                type="email"
                placeholder="patient@example.com"
                className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#394642]">
              Phone
              <input
                type="tel"
                placeholder="+44 7700 900123"
                className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
              />
            </label>
          </div>
          <button
            type="button"
            className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
          >
            Save patient placeholder
          </button>
        </form>
      </section>
    </main>
  );
}
