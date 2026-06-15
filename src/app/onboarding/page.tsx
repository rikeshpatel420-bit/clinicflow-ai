import Link from "next/link";
import { OnboardingForm } from "./onboarding-form";

const steps = [
  "Create clinic workspace",
  "Invite clinic members",
  "Add first patient records",
  "Review dashboard setup",
];

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6 py-12 text-[#17211f]">
      <section className="w-full max-w-2xl rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">
            CF
          </span>
          ClinicFlow AI
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold text-[#087968]">Clinic onboarding</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Set up your clinic workspace</h1>
          <p className="mt-3 leading-7 text-[#65736f]">
            Create the tenant workspace, owner profile, and owner membership pattern used by
            the clinic-scoped dashboard.
          </p>
        </div>

        <OnboardingForm />

        <div className="mt-8 grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <span className="grid size-8 place-items-center rounded-md bg-[#e9faf6] text-sm font-semibold text-[#087968]">
                {index + 1}
              </span>
              <p className="font-medium text-[#10201d]">{step}</p>
            </div>
          ))}
        </div>

        <Link href="/dashboard" className="mt-8 inline-flex text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Continue to dashboard
        </Link>
      </section>
    </main>
  );
}
