import Link from "next/link";
import type { DashboardClinicContext } from "@/lib/dashboard/live-data";

export function DashboardHeader({ clinic }: { clinic: DashboardClinicContext }) {
  return (
    <header className="border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{clinic.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Clinic command centre
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Live Supabase dashboard scoped to tenant, lead, call, SMS, workflow, and metric models.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/patients"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
          >
            Patients
          </Link>
          <Link
            href="/calls"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Review calls
          </Link>
        </div>
      </div>
    </header>
  );
}
