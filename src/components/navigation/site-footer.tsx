import Link from "next/link";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#dce6e3] bg-white">
      <div className="mx-auto flex max-w-[84rem] flex-col gap-6 px-4 py-8 text-sm text-[#65736f] sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-[#10201d]">ClinicFlow AI</p>
          <p className="mt-1">Never Miss a Patient Again</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-semibold text-[#10201d] hover:text-[#087968]">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
