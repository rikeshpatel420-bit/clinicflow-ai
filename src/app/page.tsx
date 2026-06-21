import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

const painPoints = [
  {
    title: "Missed calls leak revenue",
    text: "Busy front desks lose high-intent patient enquiries before anyone can call back.",
  },
  {
    title: "Patient context is scattered",
    text: "Calls, notes, appointments, and follow-ups often live across disconnected tools.",
  },
  {
    title: "Manual admin slows growth",
    text: "Reception teams spend too much time chasing replies instead of managing care flow.",
  },
];

const features = [
  "Missed call recovery",
  "AI receptionist",
  "Patient CRM",
  "Appointment scheduling",
  "Clinic analytics",
  "Admin controls",
];

const plans = [
  { name: "Starter", price: "GBP 149", detail: "For small clinics proving recovery workflows." },
  { name: "Growth", price: "GBP 299", detail: "For clinics ready to automate patient communication." },
  { name: "Scale", price: "Custom", detail: "For multi-site teams with advanced reporting needs." },
];

const roiInputs = [
  { label: "Missed calls / month", value: "80" },
  { label: "Recoverable leads", value: "32" },
  { label: "Avg booking value", value: "GBP 350" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/" variant="public" />

      <section className="mx-auto grid max-w-[84rem] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
        <div>
          <p className="mb-5 w-fit rounded-md border border-[#c8eee6] bg-white px-3 py-1.5 text-sm font-semibold text-[#087968]">
            Premium clinic operations platform
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] text-[#10201d] md:text-7xl">
            Convert missed calls into booked patients.
          </h1>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-8 text-[#52615d] md:text-lg">
            ClinicFlow AI gives clinics a calm command centre for missed call recovery,
            AI reception, patient CRM, scheduling, and operational analytics.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="rounded-full bg-[#0a8f7b] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm shadow-teal-900/10 hover:bg-[#087968]">
              Start clinic setup
            </Link>
            <Link href="/#pricing" className="rounded-full border border-[#cdd8d5] bg-white px-5 py-3 text-center text-sm font-semibold text-[#17211f] shadow-sm hover:border-[#9db2ad]">
              See pricing
            </Link>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-black/10 pt-6 text-sm">
            <div><strong className="block text-[2rem] leading-none text-[#10201d]">24/7</strong><span className="mt-1 block text-[#65736f]">patient response</span></div>
            <div><strong className="block text-[2rem] leading-none text-[#10201d]">42%</strong><span className="mt-1 block text-[#65736f]">faster follow-up</span></div>
            <div><strong className="block text-[2rem] leading-none text-[#10201d]">1 view</strong><span className="mt-1 block text-[#65736f]">for clinic ops</span></div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-6 rounded-lg bg-[#0a8f7b]/10 blur-3xl" />
          <Image
            src="/clinicflow-dashboard-preview.png"
            alt="ClinicFlow AI dashboard preview"
            width={1400}
            height={980}
            priority
            className="relative rounded-lg border border-white/80 bg-white shadow-2xl shadow-slate-900/15"
          />
        </div>
      </section>

      <section id="roi" className="border-y border-black/5 bg-white py-20">
        <div className="mx-auto grid max-w-[84rem] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-[#087968]">ROI demo</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#10201d] md:text-4xl">
              Show clinic owners the revenue hiding in missed calls.
            </h2>
            <p className="mt-4 leading-7 text-[#65736f]">
              Turn missed-call volume into recovered bookings, monthly projection, and a clear money-left-on-the-table story.
            </p>
          </div>
          <div className="rounded-lg border border-[#dce6e3] bg-[#fbfdfc] p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              {roiInputs.map((item) => (
                <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-white p-4">
                  <p className="text-sm text-[#65736f]">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[#10201d]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-[#10201d] p-6 text-white">
              <p className="text-sm font-semibold text-[#72e5d3]">Monthly recovered revenue projection</p>
              <p className="mt-3 text-5xl font-semibold">GBP 11,200</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Demo calculation: 32 recoverable leads x GBP 350 average booking value.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white py-16">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#087968]">Operational friction</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#10201d] md:text-4xl">
              Clinics do not need another inbox.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {painPoints.map((item) => (
              <article key={item.title} className="rounded-lg border border-[#e4ebe8] bg-[#fbfdfc] p-6">
                <h3 className="text-lg font-semibold text-[#10201d]">{item.title}</h3>
                <p className="mt-3 leading-7 text-[#5c6a66]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className="mx-auto grid max-w-[84rem] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold text-[#087968]">AI solution overview</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#10201d] md:text-4xl">
            One workflow from first ring to booked appointment.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {["Capture every enquiry", "Qualify patient intent", "Recover missed calls", "Route appointments"].map((item, index) => (
            <div key={item} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
              <span className="grid size-8 place-items-center rounded-md bg-[#e9faf6] text-sm font-semibold text-[#087968]">
                {index + 1}
              </span>
              <h3 className="mt-5 font-semibold text-[#10201d]">{item}</h3>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">
                Designed for practical clinic operations with clear handoff points for staff.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#111c1a] py-20 text-white">
        <div className="mx-auto max-w-[84rem] px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#72e5d3]">Core platform</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Built around the clinic front desk.</h2>
            </div>
            <p className="max-w-xl leading-7 text-white/65">
              Every module supports the MVP roadmap without introducing Twilio, Stripe, or AI workflow complexity yet.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-5 h-1.5 w-12 rounded-md bg-[#18b7a0]" />
                <h3 className="text-lg font-semibold">{feature}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Clean, clinic-ready interface patterns prepared for live data in later phases.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#087968]">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#10201d] md:text-4xl">
            Simple plans for clinics as they grow.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#10201d]">{plan.name}</h3>
              <p className="mt-5 text-4xl font-semibold text-[#10201d]">{plan.price}</p>
              <p className="mt-3 min-h-14 leading-7 text-[#65736f]">{plan.detail}</p>
              <Link href="/login" className="mt-6 block rounded-md border border-[#cdd8d5] px-4 py-3 text-center text-sm font-semibold hover:border-[#0a8f7b] hover:text-[#087968]">
                Choose plan
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[84rem] px-4 pb-20 sm:px-6">
        <div className="rounded-lg bg-[#10201d] p-8 text-white md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Ready to build the ClinicFlow MVP?</h2>
              <p className="mt-3 max-w-2xl text-white/65">
                Start with a focused SaaS surface, then connect Supabase auth, CRM data, and recovery workflows.
              </p>
            </div>
            <Link href="/dashboard" className="rounded-md bg-[#18b7a0] px-5 py-3 text-center text-sm font-semibold text-[#071311] hover:bg-[#72e5d3]">
              Book demo
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
