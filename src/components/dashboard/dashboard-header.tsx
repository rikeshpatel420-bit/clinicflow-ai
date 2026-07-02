import Link from "next/link";
import { loadDemoDataAction } from "@/app/dashboard/actions";
import { logoutAction } from "@/app/auth/actions";
import type { DashboardClinicContext } from "@/lib/dashboard/live-data";

export function DashboardHeader({
  clinic,
  demoStatus,
  showDemoDataButton = false,
}: {
  clinic: DashboardClinicContext;
  demoStatus?: string;
  showDemoDataButton?: boolean;
}) {
  return (
    <header className="border-b border-slate-200 bg-white/85 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{clinic.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Business dashboard
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Live clinic dashboard scoped to calls, bookings, revenue, follow-ups, and go-live readiness.
          </p>
          {demoStatus ? (
            <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100">
              {demoStatus}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {showDemoDataButton ? (
            <form action={loadDemoDataAction}>
              <button
                type="submit"
                className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
              >
                Load demo clinic data
              </button>
            </form>
          ) : null}
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
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
