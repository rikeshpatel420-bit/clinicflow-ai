import Link from "next/link";
import { dashboardNavItems } from "@/config/navigation";

const mobileItems = dashboardNavItems.slice(0, 8);

export function MobileDashboardNav() {
  return (
    <nav
      aria-label="Mobile dashboard navigation"
      className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden"
    >
      {mobileItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
            item.href === "/dashboard"
              ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
              : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
