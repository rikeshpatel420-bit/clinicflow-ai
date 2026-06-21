import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getCurrentUser } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";
import { OnboardingForm } from "./onboarding-form";

const steps = [
  "Create clinic workspace",
  "Invite clinic members",
  "Add first patient records",
  "Review dashboard setup",
];

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const membership = await getActiveClinicMembershipForUser(user);

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/onboarding" variant="app" />

      <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-2xl rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">
            CF
          </span>
          <span className="text-[#10201d]">ClinicFlow AI</span>
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold text-[#087968]">Clinic onboarding</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Set up your clinic workspace</h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#65736f]">
            Create the tenant workspace, app user profile, and owner membership used by
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
      </section>
      </section>

      <SiteFooter />
    </main>
  );
}
