import Link from "next/link";
import type { ReactNode } from "react";
import { appConfig } from "@/config/app";

export function AppShell({
  activeHref,
  children,
  navItems,
}: {
  activeHref: string;
  children: ReactNode;
  navItems: { href: string; label: string }[];
}) {
  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden bg-[#101817] p-5 text-white lg:block">
          <div className="flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 px-2 py-2 font-semibold">
              <span className="grid size-9 place-items-center rounded-md bg-[#18b7a0] text-sm text-[#071311]">{appConfig.shortName}</span>
              {appConfig.name}
            </div>
            <nav className="mt-10 grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    item.href === activeHref ? "bg-white text-[#101817]" : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}

