import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { generateOnboardingPackage, getOnboardingBlueprintDefaults } from "@/lib/onboarding";
import { getCurrentUser } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";
import { BusinessOnboardingWizard } from "./business-onboarding-wizard";

const steps = [
  "Create the organisation workspace",
  "Generate the brand, prompt, booking, and settings package",
  "Validate readiness and business rules",
  "Open the live dashboard and start operating",
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

  const defaultPackage = generateOnboardingPackage(getOnboardingBlueprintDefaults());

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/onboarding" variant="app" />

      <section className="mx-auto grid max-w-[92rem] gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-[#dce6e3] bg-white p-8 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">CF</span>
            <span className="text-[#10201d]">ClinicFlow AI</span>
          </Link>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Clinic onboarding</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#10201d] sm:text-4xl">Set up a business from one wizard</h1>
              <p className="mt-3 max-w-3xl text-[0.98rem] leading-7 text-[#65736f]">
                Create the tenant workspace, organisation model, brand engine, prompt studio, knowledge base, and settings package used by the
                clinic-scoped dashboard.
              </p>
            </div>
            <div className="grid gap-3 rounded-[28px] border border-[#edf2f0] bg-[#fbfdfc] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65736f]">What gets generated</p>
              <div className="grid gap-2 text-sm text-[#52615d]">
                <span>Workspace, owner membership, and profile row</span>
                <span>Brand engine, prompt studio, and knowledge base</span>
                <span>Calendar abstraction, settings engine, and self-validation</span>
              </div>
            </div>
          </div>
        </section>

        <BusinessOnboardingWizard defaultPackage={defaultPackage} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4 rounded-[18px] border border-[#edf2f0] bg-white p-4 shadow-sm">
              <span className="grid size-8 place-items-center rounded-md bg-[#e9faf6] text-sm font-semibold text-[#087968]">{index + 1}</span>
              <p className="font-medium text-[#10201d]">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
