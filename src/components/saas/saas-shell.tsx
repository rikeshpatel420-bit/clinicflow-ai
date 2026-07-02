import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/navigation/site-header";

const nav = [
  { href: "/saas", label: "Overview" },
  { href: "/organisation", label: "Tenant model" },
  { href: "/billing", label: "Billing" },
  { href: "/entitlements", label: "Entitlements" },
  { href: "/feature-flags", label: "Feature flags" },
  { href: "/platform/profiles", label: "Marketplace" },
  { href: "/platform/foundation", label: "Foundation" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/integrations/twilio", label: "Integrations" },
  { href: "/system", label: "Readiness" },
  { href: "/security", label: "Security" },
];

export function SaasShell({
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
      <SiteHeader activePath="/saas" variant="app" />
      <section className="mx-auto grid max-w-[92rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-[#dce6e3] bg-[linear-gradient(135deg,#10201d_0%,#0c2a26_55%,#0b4f47_100%)] p-6 text-white shadow-[0_24px_100px_rgba(16,33,29,0.14)] lg:p-8">
          <p className="text-sm font-semibold text-[#72e5d3]">{eyebrow}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70 sm:text-[0.98rem]">{description}</p>
            </div>
            <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm text-white/80 backdrop-blur">
              <p className="font-semibold text-white">Commercial control plane</p>
              <p>Tenant isolation, billing, marketplace activation, readiness, AI studio, and integrations in one place.</p>
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto rounded-[22px] border border-[#dce6e3] bg-white p-2 shadow-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
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
