import Link from "next/link";
import { redirect } from "next/navigation";
import { getPatientListData, type PatientRecord } from "@/lib/patients/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/navigation/site-header";

export const dynamic = "force-dynamic";

const statusOptions: Array<PatientRecord["status"] | "all"> = ["all", "lead", "active", "inactive", "archived"];

function label(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: PatientRecord["status"] | "all" }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const params = await searchParams;
  const data = await getPatientListData(user, {
    query: params.q,
    status: params.status,
  });

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <SiteHeader activePath="/patients" variant="app" />
      <section className="mx-auto grid w-full max-w-[84rem] gap-6 px-4 py-8 sm:px-6 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#087968]">{data.clinic?.name ?? "Clinic workspace"}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10201d]">Patients</h1>
            <p className="mt-2 text-sm text-[#65736f]">
              {data.source === "demo" ? "Using demo fallback patients until Supabase is configured." : "Clinic-scoped patient records from Supabase."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#9db2ad]"
            >
              Dashboard
            </Link>
            <Link
              href="/patients/new"
              className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20332f]"
            >
              Add patient
            </Link>
          </div>
        </header>

        <form className="grid gap-4 rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm md:grid-cols-[1fr_180px_auto]">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Search
            <input
              name="q"
              type="search"
              defaultValue={data.filters.query}
              placeholder="Search name, email, or phone"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Status
            <select
              name="status"
              defaultValue={data.filters.status}
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="self-end rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
          >
            Apply filters
          </button>
        </form>

        {data.error ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {data.error}
          </section>
        ) : null}

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
                <h2 className="text-lg font-semibold text-[#10201d]">Patient records</h2>
                <p className="mt-1 text-sm text-[#65736f]">{data.patients.length} records in this view.</p>
              </div>
            </div>
            {data.patients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#f7faf9] text-[#65736f]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Patient</th>
                      <th className="px-5 py-3 font-semibold">Contact</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Source</th>
                      <th className="px-5 py-3 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f0]">
                    {data.patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-[#fbfdfc]">
                        <td className="px-5 py-4">
                          <Link href={`/patients/${patient.id}`} className="font-semibold text-[#10201d] hover:text-[#087968]">
                            {patient.full_name}
                          </Link>
                          <p className="mt-1 text-xs text-[#65736f]">{patient.preferred_name ?? "No preferred name"}</p>
                        </td>
                        <td className="px-5 py-4 text-[#65736f]">
                          <p>{patient.email ?? "No email"}</p>
                          <p className="mt-1">{patient.phone ?? "No phone"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-[#e9faf6] px-2.5 py-1 text-xs font-semibold text-[#087968]">
                            {label(patient.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#394642]">{label(patient.source)}</td>
                        <td className="px-5 py-4 text-[#65736f]">
                          {new Date(patient.updated_at).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm leading-6 text-[#65736f]">
                No patients match this view. Clear filters or add the first patient record.
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
