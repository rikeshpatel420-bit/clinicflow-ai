import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/settings/activity-list";
import { OnboardingProgress } from "@/components/settings/onboarding-progress";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { billingDemo } from "@/lib/billing/data";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import { providerRegistry } from "@/lib/integrations/registry";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const sections = [
  { href: "#twilio", label: "Twilio" },
  { href: "#ai", label: "AI" },
  { href: "#voice", label: "Voice" },
  { href: "#sms", label: "SMS" },
  { href: "#hours", label: "Hours" },
  { href: "#business", label: "Business" },
  { href: "#integrations", label: "Integrations" },
  { href: "#billing", label: "Billing" },
  { href: "#team", label: "Team" },
  { href: "#roles", label: "Roles" },
  { href: "#security", label: "Security" },
  { href: "#branding", label: "Branding" },
  { href: "#audit", label: "Audit logs" },
];

export default async function SettingsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");
  const launchScore = enterpriseSettingsDemo.clinic.completion;
  const activeIntegrations = providerRegistry.filter((provider) => ["twilio", "google_calendar", "stripe", "email", "webhooks"].includes(provider.key));

  return (
    <SettingsShell
      active="/settings"
      eyebrow="Enterprise settings"
      title="Clinic operating system setup"
      description="A premium command center for Twilio, AI, voice, SMS, business hours, emergency routing, users, branding, and audit visibility."
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SettingsCard eyebrow="Launch readiness" title="Configure the business once, then go live with confidence." description="Use this control panel to finish the setup that a real owner cares about.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Go-live score", `${launchScore}%`],
              ["Branches", String(enterpriseSettingsDemo.clinic.locations.length)],
              ["Team members", String(enterpriseSettingsDemo.team.length)],
              ["Billing status", billingDemo.subscription.status],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
                <p className="mt-2 text-lg font-semibold text-[#10201d]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
              Continue onboarding
            </Link>
            <Link href="/system" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
              Review readiness
            </Link>
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Business" title="Core company details" description="The first customer should be able to set identity, branches, and contact details without touching code.">
          <div className="grid gap-3">
            {[
              ["Business", enterpriseSettingsDemo.clinic.name],
              ["Primary phone", enterpriseSettingsDemo.clinic.phone],
              ["Timezone", enterpriseSettingsDemo.clinic.timezone],
              ["Active branch", enterpriseSettingsDemo.clinic.activeClinic],
              ["Website", "clinicflow-demo.co.uk"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="rounded-full border border-[#dbe6e2] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#c8eee6] hover:bg-[#f8fffd]">
            {section.label}
          </Link>
        ))}
      </section>

      <section id="integrations" className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SettingsCard eyebrow="Integrations" title="Connected platform services" description="Show the owner which services are ready, which are placeholders, and which are waiting for credentials.">
          <div className="grid gap-3">
            {activeIntegrations.map((provider) => (
              <div key={provider.key} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#10201d]">{provider.name}</p>
                    <p className="mt-1 text-sm text-[#65736f]">{provider.category}</p>
                  </div>
                  <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">Ready</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#65736f]">{provider.description}</p>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Billing" title="Stripe-ready billing foundation" description="Plans, invoices, usage, and entitlements are visible before live payments are switched on.">
          <div className="grid gap-3">
            {billingDemo.plans.map((plan) => (
              <div key={plan.key} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#10201d]">{plan.name}</p>
                    <p className="mt-1 text-sm text-[#65736f]">{plan.displayPrice}</p>
                  </div>
                  <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">
                    {plan.key === billingDemo.subscription.planKey ? "Current" : "Available"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#65736f]">{plan.features.slice(0, 3).join(" · ")}</p>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="twilio" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SettingsCard eyebrow="Communications" title="Twilio and recovery" description="Core telephony plumbing for missed-call capture, recovery workflows, and webhook routing.">
          <div className="grid gap-3">
            {[
              ["Twilio", "Connected"],
              ["Phone number", "Active"],
              ["Voice webhook", "Ready"],
              ["SMS webhook", "Ready"],
              ["Status webhook", "Ready"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Deployment" title="Environment readiness" description="Keep the production build honest and visible before enabling live automation.">
          <div className="grid gap-3 text-sm">
            {[
              ["Site URL", "Configured"],
              ["Supabase", "Connected"],
              ["Twilio encryption", "Configured"],
              ["Audit trail", "Enabled"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-[#52615d]">{label}</span>
                  <span className="font-semibold text-[#10201d]">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="ai" className="grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="AI" title="Reception intelligence" description="Control the drafting and escalation posture that keeps receptionist output safe and consistent.">
          <div className="grid gap-3">
            {[
              ["Drafting mode", "Staff approval required"],
              ["Urgent escalation", "Enabled"],
              ["Summary generation", "On"],
              ["Confidence thresholds", "Configured"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Branding" title="ClinicFlow presentation layer" description="Keep the visual system aligned across public pages, app navigation, and operator surfaces.">
          <div className="grid gap-3">
            {[
              ["Brand", "ClinicFlow AI"],
              ["Palette", "Dark green / teal"],
              ["Typography", "Modern sans-serif"],
              ["Navigation", "Consistent and sticky"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="voice" className="grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="Voice" title="Reception call handling" description="Control the warm greeting, voicemail capture, and emergency routing behaviour.">
          <div className="grid gap-3">
            {[
              ["Greeting", "Premium clinic welcome"],
              ["Voicemail", "Transcribe and summarise"],
              ["Emergency routing", "Senior clinician first"],
              ["Recorded calls", "Stored permanently"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="SMS" title="Recovery messaging" description="Missed-call text backs, reply prompts, and follow-up templates stay visible and easy to tune.">
          <div className="grid gap-3">
            {[
              ["Default SMS", "Reply YES and we'll call you back"],
              ["Templates", "Approved and reusable"],
              ["Reply capture", "Live"],
              ["Opt-out handling", "STOP respected"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="hours" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SettingsCard eyebrow="Hours" title="Business and holiday hours" description="Keep routine callbacks, out-of-hours routing, and closures clear for the recovery engine.">
          <div className="grid gap-3">
            {[
              ["Weekdays", "08:00 - 18:30"],
              ["Saturday", "09:00 - 13:00"],
              ["Sunday", "Closed"],
              ["Holiday hours", "Configured by admin"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Routing" title="Emergency and reception team" description="Visibility into who should take the next urgent or high-value follow-up.">
          <div className="grid gap-3">
            {[
              ["Emergency routing", "Senior dentist on duty"],
              ["Reception lead", "Maya Shah"],
              ["Overflow", "Central reception pool"],
              ["After-hours", "Voicemail + SMS recovery"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="team" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SettingsCard eyebrow="Users" title="Team and invitations" description="Owners, admins, reception, and clinicians are visible at a glance.">
          <div className="grid gap-3">
            {enterpriseSettingsDemo.team.map((member) => (
              <div key={member.id} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#10201d]">{member.name}</p>
                    <p className="mt-1 text-sm text-[#65736f]">{member.email}</p>
                  </div>
                  <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Onboarding" title="Setup progress" description="A clinic should know exactly how far through setup it is before going live.">
          <OnboardingProgress steps={enterpriseSettingsDemo.onboarding} />
        </SettingsCard>
      </section>

      <section id="roles" className="grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="Roles" title="Permission matrix" description="Owners and admins should see exactly who can do what before live traffic starts.">
          <div className="grid gap-3">
            {enterpriseSettingsDemo.permissionMatrix.map((row) => (
              <div key={row.role} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-[#10201d]">{row.role}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{row.permissions.length} permissions</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.permissions.slice(0, 6).map((permission) => (
                    <span key={permission.key} className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1 text-xs font-semibold text-[#52615d]">
                      {permission.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Business hours" title="Operating windows" description="Set the rules that drive callbacks, emergency routing, and after-hours behaviour.">
          <div className="grid gap-3">
            {[
              ["Weekdays", "08:00 - 18:30"],
              ["Saturday", "09:00 - 13:00"],
              ["Sunday", "Closed"],
              ["Emergency", "Escalate at any time"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="security" className="grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="Security" title="Access and protection" description="The guardrails behind the clinic workspace stay visible for owners and admins.">
          <div className="grid gap-3">
            {enterpriseSettingsDemo.security.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{item.label}</span>
                <span className="font-semibold text-[#10201d]">{item.value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="API keys" title="Operational secrets" description="Keep API key ownership visible without surfacing the secret values themselves.">
          <div className="grid gap-3">
            {[
              ["Supabase service role", "Stored server-side only"],
              ["Twilio auth token", "Encrypted at rest"],
              ["OpenAI key", "Not configured here"],
              ["Webhook signing", "Verified by the backend"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>

      <section id="branding" className="grid gap-6 lg:grid-cols-2">
        <SettingsCard eyebrow="Notifications" title="Owner and team preferences" description="Calm, selective notifications for the events that matter most.">
          <div className="grid gap-3">
            {enterpriseSettingsDemo.notificationPreferences.map((item) => (
              <div key={item.label} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-[#10201d]">{item.label}</p>
                  <span className="text-sm font-semibold text-[#087968]">{item.enabled ? "On" : "Off"}</span>
                </div>
                <p className="mt-1 text-sm text-[#65736f]">{item.channel}</p>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Audit" title="Recent activity" description="A short, readable audit trail for the clinic owner.">
          <ActivityList items={enterpriseSettingsDemo.activity} />
        </SettingsCard>
      </section>

      <section id="audit" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SettingsCard eyebrow="Status" title="Current clinic state" description="Use these numbers to sanity-check the setup before launch.">
          <div className="grid gap-3">
            {[
              ["Clinic group", enterpriseSettingsDemo.clinic.name],
              ["Active clinic", enterpriseSettingsDemo.clinic.activeClinic],
              ["Timezone", enterpriseSettingsDemo.clinic.timezone],
              ["Primary phone", enterpriseSettingsDemo.clinic.phone],
              ["Setup completion", `${enterpriseSettingsDemo.clinic.completion}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard eyebrow="Next step" title="Launch checklist" description="A clear next move keeps the clinic owner focused.">
          <div className="grid gap-3">
            {[
              "Confirm Twilio connection and webhook URLs.",
              "Review AI summary tone and emergency routing.",
              "Invite the reception team and clinicians.",
              "Load demo data or start capturing real activity.",
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm leading-7 text-[#10201d]">
                {item}
              </div>
            ))}
          </div>
        </SettingsCard>
      </section>
    </SettingsShell>
  );
}
