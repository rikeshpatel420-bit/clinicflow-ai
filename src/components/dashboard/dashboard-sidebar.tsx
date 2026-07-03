import Link from "next/link";
import { dashboardNavItems } from "@/config/navigation";

const primaryItems = dashboardNavItems.slice(0, 12);

export function DashboardSidebar({ activePath = "/dashboard" }: { activePath?: string }) {
  return (
    <aside className="hidden border-r border-slate-200 bg-white/95 px-4 py-5 text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white lg:block">
      <div className="flex h-full min-h-[calc(100vh-2.5rem)] flex-col">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid size-10 place-items-center rounded-lg bg-teal-500 text-sm font-bold text-slate-950">CF</span>
          <span>
            <span className="block text-sm font-semibold">ClinicFlow AI</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Clinic operations</span>
          </span>
        </Link>

        <nav aria-label="Dashboard navigation" className="mt-8 grid gap-1">
          {primaryItems.map((item) => {
            const isActive = activePath === item.href || (item.href !== "/dashboard" && activePath.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Production mode</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Live data is scoped by Supabase RLS. Patient details stay minimised on this overview.
          </p>
        </div>
      </div>
    </aside>
  );
}
