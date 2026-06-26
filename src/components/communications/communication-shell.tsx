import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/navigation/site-header";

const nav = [
  { href: "/communications", label: "Communications" },
  { href: "/inbox", label: "Inbox" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/engagement", label: "Engagement" },
  { href: "/threads", label: "Threads" },
  { href: "/reminders", label: "Reminders" },
  { href: "/reactivation", label: "Reactivation" },
];

export function CommunicationShell({
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
      <SiteHeader activePath={active} variant="app" />
      <section className="mx-auto grid max-w-[88rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-lg bg-[#10201d] p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65">{description}</p>
        </header>
        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-[#dce6e3] bg-white p-2 shadow-sm">
          {nav.map((item) => (
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

