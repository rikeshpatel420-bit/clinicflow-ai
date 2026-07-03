import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { appConfig } from "@/config/app";

type NavItem = {
  href: string;
  label: string;
};

const publicNav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

const appNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ai", label: "AI Console" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/workflows", label: "Workflows" },
  { href: "/patients", label: "Patients" },
  { href: "/calls", label: "Calls" },
  { href: "/calendar", label: "Calendar" },
  { href: "/inbox", label: "Inbox" },
  { href: "/integrations/twilio", label: "Integrations" },
  { href: "/settings", label: "Settings" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/factory", label: "Factory" },
  { href: "/saas", label: "SaaS" },
  { href: "/system", label: "System" },
  { href: "/", label: "Public site" },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/#features" || href === "/#pricing") {
    return currentPath === "/";
  }

  return currentPath === href || (href !== "/" && currentPath.startsWith(`${href}/`));
}

function navItemClass(active: boolean, variant: "public" | "app") {
  const base =
    "inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18b7a0]/40";
  const text = variant === "public" ? "text-[#4d5d58]" : "text-[#41524c]";

  return `${base} ${text} ${active ? "bg-[#e8f8f4] text-[#087968] shadow-sm" : "hover:bg-[#f3f7f6] hover:text-[#10201d]"}`;
}

function actionButtonClass(primary = false) {
  return primary
    ? "inline-flex items-center justify-center rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] transition hover:bg-[#066657] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18b7a0]/40"
    : "inline-flex items-center justify-center rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm transition hover:border-[#9db2ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18b7a0]/35";
}

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 font-semibold text-[#10201d]">
      <span className="grid size-9 place-items-center rounded-xl bg-[#10201d] text-sm text-white shadow-sm">
        CF
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm tracking-wide sm:text-base">{appConfig.name}</span>
        <span className="text-xs font-medium text-[#6b7b76]">Premium healthcare operations</span>
      </span>
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
    <header className="sticky top-0 z-40 border-b border-[#dbe6e2] bg-white/88 backdrop-blur-xl">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Brand href={variant === "app" ? "/dashboard" : "/"} />

            <details className="group relative lg:hidden">
              <summary className="list-none rounded-full border border-[#d6e0dc] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] shadow-sm">
                Menu
              </summary>
              <div className="absolute left-0 right-0 z-50 mt-3 rounded-[24px] border border-[#dce6e3] bg-white p-4 shadow-[0_24px_80px_rgba(16,33,29,0.12)]">
                <nav className="grid gap-2">
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
                <div className="mt-4 grid gap-2 border-t border-[#edf2f0] pt-4">
                  {variant === "public" ? (
                    <>
                      <Link href="/login" className={actionButtonClass()}>
                        Login
                      </Link>
                      <Link href="/signup" className={actionButtonClass(true)}>
                        Get Started
                      </Link>
                      <Link href="/book-demo" className={actionButtonClass()}>
                        Book Demo
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/" className={actionButtonClass()}>
                        Public site
                      </Link>
                      <form action={logoutAction}>
                        <button type="submit" className={actionButtonClass(true)}>
                          Sign out
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </details>
          </div>

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-2 lg:flex">
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

          <div className="hidden items-center gap-3 lg:flex">
            {variant === "public" ? (
              <>
                <Link href="/login" className={actionButtonClass()}>
                  Login
                </Link>
                <Link href="/signup" className={actionButtonClass(true)}>
                  Get Started
                </Link>
                <Link href="/book-demo" className={actionButtonClass()}>
                  Book Demo
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className={actionButtonClass()}>
                  Public site
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className={actionButtonClass(true)}>
                    Sign out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
