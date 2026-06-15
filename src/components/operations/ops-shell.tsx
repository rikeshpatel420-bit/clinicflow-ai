import Link from "next/link";
import type { ReactNode } from "react";

const opsNav = [
  { href: "/operations", label: "Operations" },
  { href: "/alerts", label: "Alerts" },
  { href: "/activity", label: "Activity" },
  { href: "/analytics", label: "Analytics" },
];

export function OpsShell({
  active,
  children,
  eyebrow,
  title,
  description,
}: {
  active: string;
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8">
        <header className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">{eyebrow}</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">{description}</p>
            </div>
            <Link href="/dashboard" className="w-fit rounded-md bg-[#18b7a0] px-4 py-3 text-sm font-semibold text-[#071311]">
              Owner dashboard
            </Link>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-[#dce6e3] bg-white p-2 shadow-sm">
          {opsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold ${
                active === item.href ? "bg-[#10201d] text-white" : "text-[#65736f] hover:bg-[#f7faf9] hover:text-[#10201d]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </section>
    </main>
  );
}

