import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";

type PublicNavItem = {
  href: string;
  label: string;
};

type AppNavItem = {
  href: string;
  label: string;
};

const publicNav: PublicNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

const appNav: AppNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/patients", label: "Patients" },
  { href: "/calls", label: "Calls" },
  { href: "/integrations/twilio", label: "Twilio / Integrations" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/", label: "Home / Public site" },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/#features" || href === "/#pricing") {
    return currentPath === "/";
  }

  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function navItemClass(active: boolean, variant: "public" | "app") {
  const base = "rounded-full px-3.5 py-2 text-sm font-semibold transition";

  if (variant === "public") {
    return `${base} ${active ? "bg-[#e8f8f4] text-[#087968] shadow-sm" : "text-[#52615d] hover:bg-[#f3f7f6] hover:text-[#10201d]"}`;
  }

  return `${base} ${active ? "bg-[#e8f8f4] text-[#087968] shadow-sm" : "text-[#52615d] hover:bg-[#f3f7f6] hover:text-[#10201d]"}`;
}

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 font-semibold text-[#10201d]">
      <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white shadow-sm">
        CF
      </span>
      <span className="text-sm tracking-wide sm:text-base">ClinicFlow AI</span>
    </Link>
  );
}

export function SiteHeader({
  activePath,
  variant,
}: {
  activePath: string;
  variant: "app" | "public";
}) {
  const nav = variant === "app" ? appNav : publicNav;

  return (
    <header className="sticky top-0 z-40 border-b border-[#dce6e3] bg-white/92 shadow-[0_1px_0_rgba(16,33,29,0.02)] backdrop-blur">
      <div className="mx-auto flex max-w-[84rem] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Brand href={variant === "app" ? "/dashboard" : "/"} />
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActivePath(activePath, item.href) ? "page" : undefined}
              className={navItemClass(isActivePath(activePath, item.href), variant)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          {variant === "public" ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]"
              >
                Login
              </Link>
              <Link href="/signup" className="rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#066657]">
                Get Started
              </Link>
              <Link
                href="/#pricing"
                className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]"
              >
                Book Demo
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]"
              >
                Home / Public site
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-[#10201d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#20332f]"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
