import { BookDemoForm } from "@/components/home/book-demo-form";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

export default function BookDemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,121,104,0.14),_transparent_30%),linear-gradient(180deg,_#f7faf9_0%,_#eef4f2_100%)] text-[#17211f]">
      <SiteHeader activePath="/book-demo" variant="public" />
      <section className="mx-auto max-w-[84rem] px-4 py-16 sm:px-6 lg:py-20">
        <BookDemoForm />
      </section>
      <SiteFooter />
    </main>
  );
}
