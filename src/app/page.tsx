import Image from "next/image";
import Link from "next/link";
import { AnimatedMetrics } from "@/components/home/animated-metrics";
import { RoiCalculator } from "@/components/home/roi-calculator";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

const features = [
  {
    detail: "Spot the treatment revenue hiding inside missed calls, unanswered enquiries, and follow-up gaps.",
    title: "Revenue recovery engine",
  },
  {
    detail: "See patients, calls, SMS events, and recovery workflows in one calm operational view.",
    title: "Clinic-wide visibility",
  },
  {
    detail: "Turn real-time call handling into a premium patient experience that feels fast and thoughtful.",
    title: "Patient-first follow-up",
  },
];

const howItWorks = [
  {
    detail: "A patient calls the clinic with a treatment enquiry, emergency concern, or reactivation opportunity.",
    title: "Patient Calls Clinic",
  },
  {
    detail: "The front desk misses the call during a busy moment, lunch cover, or after-hours window.",
    title: "Clinic Misses Call",
  },
  {
    detail: "ClinicFlow AI sends a calm, timely follow-up that turns the missed enquiry into a booked conversation.",
    title: "ClinicFlow AI Instantly Follows Up",
  },
];

const testimonials = [
  {
    role: "Dental Practice Owner",
    quote:
      "ClinicFlow makes the missed-call story feel visible and actionable. It is the first dashboard I would put in front of a partner before a growth meeting.",
  },
  {
    role: "Orthodontic Practice",
    quote:
      "The patient recovery flow is simple, elegant, and believable. It gives our front desk a cleaner way to handle high-intent enquiries.",
  },
  {
    role: "Private Healthcare Clinic",
    quote:
      "The brand feel is premium without being noisy. It looks like software built for a serious clinic operator, not a side project.",
  },
];

const comparison = {
  without: [
    "Missed calls sit unanswered and forgotten.",
    "No structured follow-up path exists.",
    "Revenue slips away without visibility.",
  ],
  with: [
    "Instant SMS recovery keeps the conversation moving.",
    "Automated engagement reopens high-intent leads.",
    "More appointments are recovered with less admin.",
  ],
};

const plans = [
  { name: "Starter", price: "£149", detail: "For small clinics proving recovery workflows." },
  { name: "Growth", price: "£299", detail: "For clinics ready to automate patient communication." },
  { name: "Scale", price: "Custom", detail: "For multi-site teams with advanced reporting needs." },
];

const heroMetrics = [
  { label: "Recovered revenue", prefix: "£", value: 18400, note: "Tracked across booked recoveries and reactivated opportunities." },
  { label: "Appointments recovered", value: 427, note: "Recovered from missed-call, reactivation, and callback workflows." },
  { label: "Patient response rate", suffix: "%", value: 94, note: "Measured from the latest demo clinic workflow snapshot." },
];

function currency(value: number) {
  return `£${value.toLocaleString("en-GB")}`;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,121,104,0.14),_transparent_30%),linear-gradient(180deg,_#f7faf9_0%,_#f3f8f6_58%,_#eef4f2_100%)] text-[#17211f]">
      <SiteHeader activePath="/" variant="public" />

      <section className="mx-auto grid max-w-[84rem] gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
        <div>
          <p className="w-fit rounded-full border border-[#c8eee6] bg-white/80 px-3 py-1.5 text-sm font-semibold text-[#087968] shadow-sm backdrop-blur">
            Premium clinic operations platform
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-[#10201d] md:text-7xl">
            Never Miss a Patient Again
          </h1>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-8 text-[#52615d] md:text-lg">
            ClinicFlow AI automatically recovers missed calls, reactivates patients, and turns lost opportunities into booked appointments.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center rounded-full bg-[#087968] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(8,121,104,0.24)] transition hover:bg-[#066657]"
            >
              Book a Demo
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-[#cdd8d5] bg-white/80 px-6 py-3.5 text-sm font-semibold text-[#10201d] shadow-sm backdrop-blur transition hover:border-[#9db2ad] hover:bg-white"
            >
              See How It Works
            </Link>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-[#52615d] sm:grid-cols-3">
            {["Missed-call recovery", "Patient reactivation", "Executive-ready reporting"].map((item) => (
              <div key={item} className="rounded-full border border-[#dce6e3] bg-white/75 px-4 py-3 text-center shadow-sm backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-6 rounded-[34px] bg-[#087968]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-white/50 bg-white/70 p-5 shadow-[0_30px_120px_rgba(16,33,29,0.12)] backdrop-blur-xl">
            <div className="overflow-hidden rounded-[28px] border border-[#dce6e3] bg-[#10201d] p-5 text-white shadow-[0_24px_80px_rgba(16,33,29,0.18)]">
              <p className="text-sm font-semibold text-[#72e5d3]">Demo performance snapshot</p>
              <div className="mt-5">
                <AnimatedMetrics metrics={heroMetrics} />
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="overflow-hidden rounded-[26px] border border-[#dce6e3] bg-white p-4 shadow-sm">
                <Image
                  src="/clinicflow-dashboard-preview.png"
                  alt="ClinicFlow AI dashboard preview"
                  width={1200}
                  height={860}
                  priority
                  className="h-full w-full rounded-[20px] object-cover"
                />
              </div>
              <div className="grid gap-4">
                {[
                  ["Recovered revenue", currency(18400), "Illustrative demo mode"],
                  ["Appointments booked", "427", "Recovery + reactivation"],
                  ["Patient response rate", "94%", "Measured across the demo"],
                ].map(([label, value, note]) => (
                  <article key={label} className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-[#10201d]">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-[#65736f]">{note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[84rem] px-4 pb-8 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#087968]">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d] md:text-4xl">
            Built to feel premium from the first glance.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[28px] border border-[#dce6e3] bg-white/85 p-6 shadow-[0_20px_80px_rgba(16,33,29,0.08)] backdrop-blur"
            >
              <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-[#087968] to-[#72e5d3]" />
              <h3 className="mt-5 text-xl font-semibold text-[#10201d]">{feature.title}</h3>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#65736f]">{feature.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[84rem] px-4 pb-20 sm:px-6">
        <div className="grid gap-4 rounded-[28px] border border-white/40 bg-white/75 p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)] backdrop-blur xl:grid-cols-4">
          {[
            ["£18,400", "Recovered revenue", "From the demo clinic snapshot."],
            ["427", "Appointments recovered", "Turned from missed and reactivated enquiries."],
            ["94%", "Patient response rate", "A calmer follow-up workflow."],
            ["1 view", "For the whole clinic", "Front desk, recovery, and owner visibility."],
          ].map(([value, label, note]) => (
            <article key={label} className="rounded-[24px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
              <p className="text-3xl font-semibold tracking-tight text-[#10201d]">{value}</p>
              <p className="mt-2 text-sm font-semibold text-[#087968]">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#087968]">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d] md:text-4xl">
            A clear 3-step recovery flow for busy clinics.
          </h2>
        </div>
        <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-[#c8ddd9] to-transparent lg:block" />
          {howItWorks.map((step, index) => (
            <article
              key={step.title}
              className="relative rounded-[28px] border border-[#dce6e3] bg-white/90 p-6 shadow-[0_20px_80px_rgba(16,33,29,0.08)] backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#e8f8f4] text-lg font-semibold text-[#087968]">
                  0{index + 1}
                </span>
                <span className="text-sm font-semibold text-[#65736f]">Step {index + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[#10201d]">{step.title}</h3>
              <p className="mt-3 text-[0.98rem] leading-7 text-[#65736f]">{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6">
        <RoiCalculator />
      </section>

      <section className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#087968]">Social proof</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d] md:text-4xl">
            Designed to feel credible in front of a clinic owner.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.role} className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_20px_80px_rgba(16,33,29,0.07)]">
              <p className="text-sm font-semibold text-[#087968]">{item.role}</p>
              <p className="mt-5 text-[1rem] leading-8 text-[#10201d]">“{item.quote}”</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[30px] border border-[#e7ecea] bg-white p-6 shadow-[0_20px_80px_rgba(16,33,29,0.08)]">
            <p className="text-sm font-semibold text-[#8c5c4b]">Without ClinicFlow</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10201d]">Missed calls turn into lost revenue.</h3>
            <div className="mt-6 grid gap-3">
              {comparison.without.map((item) => (
                <div key={item} className="rounded-2xl border border-[#f0e4de] bg-[#fff8f5] px-4 py-3 text-[0.98rem] leading-7 text-[#5d463d]">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-[#c8eee6] bg-[linear-gradient(180deg,#f6fffc_0%,#ffffff_100%)] p-6 shadow-[0_24px_100px_rgba(8,121,104,0.1)]">
            <p className="text-sm font-semibold text-[#087968]">With ClinicFlow</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#10201d]">The recovery loop stays visible and calm.</h3>
            <div className="mt-6 grid gap-3">
              {comparison.with.map((item) => (
                <div key={item} className="rounded-2xl border border-[#d7efe8] bg-white px-4 py-3 text-[0.98rem] leading-7 text-[#10201d] shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[84rem] px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#087968]">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d] md:text-4xl">
            Simple plans for clinics as they grow.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`rounded-[28px] border p-6 shadow-[0_20px_80px_rgba(16,33,29,0.08)] ${
                index === 1 ? "border-[#c8eee6] bg-white" : "border-[#dce6e3] bg-white/90"
              }`}
            >
              <p className="text-sm font-semibold text-[#087968]">{plan.name}</p>
              <p className="mt-5 text-5xl font-semibold tracking-tight text-[#10201d]">{plan.price}</p>
              <p className="mt-3 min-h-14 text-[0.98rem] leading-7 text-[#65736f]">{plan.detail}</p>
              <Link
                href="/book-demo"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                  index === 1
                    ? "bg-[#087968] text-white hover:bg-[#066657]"
                    : "border border-[#cdd8d5] bg-white text-[#10201d] hover:border-[#9db2ad]"
                }`}
              >
                Book a Demo
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[84rem] px-4 pb-20 sm:px-6">
        <div className="rounded-[32px] border border-[#dce6e3] bg-[#10201d] p-8 text-white shadow-[0_30px_120px_rgba(16,33,29,0.18)] md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#72e5d3]">Ready to see the full product?</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Book a demo and walk through the recovery flow live.</h2>
              <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-white/70">
                The platform is built to feel premium from the first click, with a calm visual system, strong navigation, and a clear recovery story.
              </p>
            </div>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center rounded-full bg-[#72e5d3] px-6 py-3.5 text-sm font-semibold text-[#071311] shadow-lg shadow-teal-900/20 transition hover:bg-white"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
