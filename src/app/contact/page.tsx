import Link from "next/link";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/contact" variant="public" />
      <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6">
        <article className="max-w-3xl rounded-lg border border-[#dce6e3] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Contact</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Contact ClinicFlow AI</h1>
          <p className="mt-4 text-[0.98rem] leading-7 text-[#65736f]">
            This placeholder page is reserved for support and sales contact details. Add the production inbox or booking
            link here when the public site is final.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-[#10201d] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20332f]">
            Back home
          </Link>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
