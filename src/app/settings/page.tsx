import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingProgress } from "@/components/settings/onboarding-progress";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <SettingsShell
      active="/settings"
      eyebrow="Enterprise settings"
      title="Clinic operating system setup"
      description="Demo-only settings architecture for clinic profile, onboarding completion, notification preferences, and multi-location readiness."
    >
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <SettingsCard title="Clinic profile" eyebrow="Workspace" description="Group-level configuration prepared for multi-location SaaS accounts.">
          <div className="grid gap-3 text-sm">
            {[
              ["Clinic group", enterpriseSettingsDemo.clinic.name],
              ["Active clinic", enterpriseSettingsDemo.clinic.activeClinic],
              ["Timezone", enterpriseSettingsDemo.clinic.timezone],
              ["Primary phone", enterpriseSettingsDemo.clinic.phone],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <span className="font-medium text-[#65736f]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Onboarding completion" eyebrow={`${enterpriseSettingsDemo.clinic.completion}% complete`} description="Tracks the setup work required before a clinic can safely run live automations.">
          <OnboardingProgress steps={enterpriseSettingsDemo.onboarding} />
        </SettingsCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SettingsCard title="Clinic switching" description="Prepared UX for owners managing multiple practices or enterprise groups.">
          <div className="grid gap-2">
            {enterpriseSettingsDemo.clinic.locations.map((location) => (
              <button
                key={location}
                type="button"
                className={`rounded-md border px-4 py-3 text-left text-sm font-semibold ${
                  location === enterpriseSettingsDemo.clinic.activeClinic
                    ? "border-[#18b7a0] bg-[#e8f8f4] text-[#087968]"
                    : "border-[#dce6e3] bg-white text-[#394642]"
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Notification preferences" description="Owner-level routing for retention-critical alerts.">
          <div className="grid gap-3">
            {enterpriseSettingsDemo.notificationPreferences.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{item.label}</p>
                  <span className="text-sm font-semibold text-[#087968]">{item.enabled ? "On" : "Off"}</span>
                </div>
                <p className="mt-1 text-sm text-[#65736f]">{item.channel}</p>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Enterprise architecture" description="Separate pages keep account, security, and team ownership clear.">
          <div className="grid gap-3">
            {[
              ["/team", "Manage team"],
              ["/security", "Review security"],
              ["/account", "Account settings"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white">
                {label}
              </Link>
            ))}
          </div>
        </SettingsCard>
      </section>
    </SettingsShell>
  );
}

