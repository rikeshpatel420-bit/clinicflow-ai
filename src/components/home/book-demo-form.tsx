"use client";

import { useRef, useState } from "react";

export function BookDemoForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          console.log("ClinicFlow book demo lead", Object.fromEntries(formData.entries()));
          setSubmitted(true);
          event.currentTarget.reset();
        }}
        className="grid gap-4 rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]"
      >
        <div>
          <p className="text-sm font-semibold text-[#087968]">Book a demo</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#10201d]">Tell us about your clinic</h1>
          <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-[#65736f]">
            Leave a few details and we&apos;ll follow up with a tailored walkthrough of missed-call recovery, CRM, and patient reactivation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Name
            <input
              name="name"
              required
              className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
              placeholder="Rikesh Patel"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Clinic name
            <input
              name="clinicName"
              required
              className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
              placeholder="Riverside Dental"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Email
            <input
              name="email"
              type="email"
              required
              className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
              placeholder="you@clinic.com"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Phone
            <input
              name="phone"
              type="tel"
              className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
              placeholder="+44 7700 900000"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Notes
          <textarea
            name="notes"
            rows={5}
            className="rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-[#10201d] outline-none transition focus:border-[#087968] focus:bg-white focus:ring-4 focus:ring-[#c8eee6]"
            placeholder="Tell us what you want to recover, reactivate, or automate."
          />
        </label>

        <button
          type="submit"
          className="inline-flex justify-center rounded-full bg-[#087968] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:bg-[#066657] focus:outline-none focus:ring-4 focus:ring-[#c8eee6]"
        >
          Send demo request
        </button>

        {submitted ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            Thanks - the request has been logged locally as a placeholder.
          </p>
        ) : null}
      </form>

      <aside className="grid gap-4 rounded-[28px] border border-[#dce6e3] bg-[#10201d] p-6 text-white shadow-[0_24px_100px_rgba(16,33,29,0.2)]">
        <div>
          <p className="text-sm font-semibold text-[#72e5d3]">What happens next</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">A calm, structured walkthrough for the clinic owner.</h2>
        </div>

        <div className="grid gap-4">
          {[
            "We review missed-call recovery and response times.",
            "We map your clinic flow and patient reactivation opportunities.",
            "We show the dashboard, calls, patients, and onboarding experience.",
          ].map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Step {index + 1}</p>
              <p className="mt-2 text-sm leading-6 text-white/80">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-sm font-semibold text-[#72e5d3]">Best for</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Dental owners, orthodontic practices, and private healthcare teams that want to recover missed opportunities without adding admin load.
          </p>
        </div>
      </aside>
    </div>
  );
}
