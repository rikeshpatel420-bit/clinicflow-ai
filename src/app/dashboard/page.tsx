import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardNavItems } from "@/config/navigation";
import { getDashboardData } from "@/lib/dashboard/data";
import { calculateRecoveryMetrics, formatCurrency, getRecoveryData } from "@/lib/recovery/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) {
    redirect("/login");
  }

  const dashboard = await getDashboardData(user?.id ?? null);
  const recovery = await getRecoveryData(user?.id ?? null);
  const recoveryMetrics = calculateRecoveryMetrics(recovery.opportunities);

  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden bg-[#101817] p-5 text-white lg:block">
          <div className="flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 px-2 py-2 font-semibold">
              <span className="grid size-9 place-items-center rounded-md bg-[#18b7a0] text-sm text-[#071311]">
                CF
              </span>
              ClinicFlow AI
            </div>
            <nav className="mt-10 grid gap-1">
              {dashboardNavItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    index === 0 ? "bg-white text-[#101817]" : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-lg border border-white/10 bg-[#18b7a0]/10 p-4">
              <p className="text-sm font-semibold text-[#72e5d3]">Data source</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {dashboard.source === "demo" ? "Demo fallback data" : "Supabase clinic data"}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-black/5 bg-white/80 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#087968]">
                  {dashboard.clinic?.name ?? "Clinic dashboard"}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[#10201d]">Today&apos;s operational flow</h1>
                <p className="mt-2 text-sm text-[#65736f]">
                  {dashboard.source === "demo"
                    ? "Supabase env vars are missing, so this dashboard is using demo fallback data."
                    : `Clinic-scoped workspace${dashboard.profile?.full_name ? ` for ${dashboard.profile.full_name}` : ""}.`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/onboarding"
                  className="rounded-md border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#9db2ad]"
                >
                  Onboarding
                </Link>
                <Link
                  href="/patients/new"
                  className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20332f]"
                >
                  New patient
                </Link>
              </div>
            </div>
          </header>

          <div className="grid gap-6 p-5 md:p-8 xl:grid-cols-[1fr_360px]">
            <div className="grid gap-6">
              {dashboard.error ? (
                <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                  {dashboard.error}
                </section>
              ) : null}

              {dashboard.emptyMessage ? (
                <section className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#10201d]">No clinic workspace yet</h2>
                  <p className="mt-2 text-sm leading-6 text-[#65736f]">{dashboard.emptyMessage}</p>
                  <Link
                    href="/onboarding"
                    className="mt-5 inline-flex rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
                  >
                    Create clinic
                  </Link>
                </section>
              ) : null}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.metrics.map((stat) => (
                  <article key={stat.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-[#65736f]">{stat.label}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-4xl font-semibold text-[#10201d]">{stat.value}</p>
                      <p className={`text-sm font-semibold ${stat.tone}`}>{stat.change}</p>
                    </div>
                  </article>
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#087968]">Revenue recovery summary</p>
                      <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">
                        {formatCurrency(recoveryMetrics.revenueRecovered)} recovered from missed-call leads
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#65736f]">
                        Demo projection: {formatCurrency(recoveryMetrics.monthlyProjection)} recovered per month if this pace continues.
                      </p>
                    </div>
                    <Link href="/recovery" className="rounded-md bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#20332f]">
                      View recovery
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["missed", "contacted", "booked"].map((stage) => (
                      <div key={stage} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                        <p className="text-xs font-semibold uppercase text-[#65736f]">{stage}</p>
                        <p className="mt-2 text-2xl font-semibold text-[#10201d]">
                          {recovery.opportunities.filter((item) => item.stage === stage).length}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg bg-[#10201d] p-5 text-white shadow-sm">
                  <p className="text-sm font-semibold text-[#72e5d3]">Money left on the table</p>
                  <p className="mt-4 text-4xl font-semibold">{formatCurrency(recoveryMetrics.moneyLeftOnTable)}</p>
                  <p className="mt-3 text-sm leading-6 text-white/65">
                    Open demo opportunities ranked by value and priority are waiting in the recovery pipeline.
                  </p>
                </article>
              </section>

              <section className="rounded-lg border border-[#dce6e3] bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#edf2f0] p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#10201d]">Recent missed calls</h2>
                    <p className="mt-1 text-sm text-[#65736f]">Placeholder call rows derived from phone-sourced patients.</p>
                  </div>
                  <Link
                    href="/calls"
                    className="w-fit rounded-md border border-[#cdd8d5] px-3 py-2 text-sm font-semibold hover:border-[#0a8f7b]"
                  >
                    {dashboard.calls.length} queued
                  </Link>
                </div>
                {dashboard.calls.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-[#f7faf9] text-[#65736f]">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Patient</th>
                          <th className="px-5 py-3 font-semibold">Phone</th>
                          <th className="px-5 py-3 font-semibold">Intent</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2f0]">
                        {dashboard.calls.map((call) => (
                          <tr key={call.id} className="hover:bg-[#fbfdfc]">
                            <td className="px-5 py-4 font-semibold text-[#10201d]">{call.patient_name}</td>
                            <td className="px-5 py-4 text-[#65736f]">{call.phone ?? "No phone"}</td>
                            <td className="px-5 py-4 text-[#394642]">{call.reason}</td>
                            <td className="px-5 py-4">
                              <span className="rounded-md bg-[#e9faf6] px-2.5 py-1 text-xs font-semibold text-[#087968]">
                                {statusLabel(call.status)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-[#65736f]">
                              {new Date(call.created_at).toLocaleDateString("en-GB")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-sm leading-6 text-[#65736f]">
                    No missed-call placeholders yet. Add a patient with source set to phone to populate this queue.
                  </div>
                )}
              </section>
            </div>

            <aside className="grid gap-6">
              <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#10201d]">Appointment activity</h2>
                {dashboard.activity.length > 0 ? (
                  <div className="mt-5 grid gap-4">
                    {dashboard.activity.map((item) => (
                      <div key={item.title} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                        <p className="font-semibold text-[#10201d]">{item.title}</p>
                        <p className="mt-1 text-sm text-[#65736f]">{item.meta}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[#65736f]">
                    No activity yet. Patient and appointment events will appear here as modules are connected.
                  </p>
                )}
              </section>

              <section className="rounded-lg bg-[#10201d] p-5 text-white shadow-sm">
                <p className="text-sm font-semibold text-[#72e5d3]">Next best action</p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {dashboard.clinic ? "Review patient records before adding call workflows." : "Create a clinic workspace."}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Patients are loading from Supabase when configured. Calls remain a placeholder model until the Twilio phase.
                </p>
                <Link
                  href="/onboarding"
                  className="mt-6 inline-flex rounded-md bg-[#18b7a0] px-4 py-3 text-sm font-semibold text-[#071311] hover:bg-[#72e5d3]"
                >
                  Open onboarding
                </Link>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
