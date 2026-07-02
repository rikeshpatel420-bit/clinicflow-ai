import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivityList } from "@/components/settings/activity-list";
import { OnboardingProgress } from "@/components/settings/onboarding-progress";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { SettingsSubmitButton } from "@/components/settings/settings-submit-button";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import type { OnboardingStep } from "@/lib/settings/data";
import {
  createDefaultClinicBusinessConfiguration,
  formatBranchList,
  formatLines,
  formatServiceList,
  formatStaffList,
} from "@/lib/settings/configuration";
import { getClinicSettingsSnapshot } from "@/lib/settings/store";
import { providerRegistry } from "@/lib/integrations/registry";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { saveClinicSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

const sections = [
  { href: "#business", label: "Business" },
  { href: "#hours", label: "Hours" },
  { href: "#branches", label: "Branches" },
  { href: "#branding", label: "Branding" },
  { href: "#services", label: "Services" },
  { href: "#ai", label: "AI" },
  { href: "#knowledge", label: "Knowledge" },
  { href: "#notifications", label: "Notifications" },
  { href: "#team", label: "Team" },
  { href: "#billing", label: "Billing" },
  { href: "#customer", label: "Customer" },
  { href: "#launch", label: "Go live" },
];

function statusPill(status?: string) {
  if (status === "saved") return { text: "Saved", tone: "success" as const };
  if (status === "error") return { text: "Could not save", tone: "error" as const };
  if (status === "not-authorised") return { text: "Owner or admin required", tone: "error" as const };
  return null;
}

function inputClassName() {
  return "rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm text-[#10201d] outline-none transition focus:border-[#18b7a0] focus:bg-white focus:ring-2 focus:ring-[#c6f1e7]";
}

function textareaClassName() {
  return `${inputClassName()} min-h-[112px]`;
}

function sectionNoteClassName() {
  return "text-sm leading-6 text-[#65736f]";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();

  if (isSupabaseConfigured && !user) redirect("/login");

  const membership = user ? await getActiveClinicMembershipForUser(user) : null;
  if (isSupabaseConfigured && user && !membership) redirect("/onboarding");

  const params = await searchParams;
  const message = statusPill(params?.status);

  const snapshot = membership ? await getClinicSettingsSnapshot(membership.clinic_id) : null;
  const config = snapshot?.clinic.business_configuration ?? createDefaultClinicBusinessConfiguration();
  const launchState = snapshot?.clinic.launch_state;
  const auditItems = membership
    ? await (async () => {
        try {
          const admin = createSupabaseAdminClient();
          const { data } = await admin
            .from("audit_events")
            .select("id,event_type,entity_table,created_at")
            .eq("clinic_id", membership.clinic_id)
            .order("created_at", { ascending: false })
            .limit(3);

          return (
            data?.map((event) => ({
              id: event.id,
              actor: "System",
              action: event.event_type.replaceAll("_", " "),
              area: event.entity_table,
              createdAt: new Date(event.created_at).toLocaleString("en-GB"),
            })) ?? enterpriseSettingsDemo.activity
          );
        } catch {
          return enterpriseSettingsDemo.activity;
        }
      })()
    : enterpriseSettingsDemo.activity;
  const knowledgeFields: Array<{
    label: string;
    name: string;
    placeholder: string;
    value: string[];
  }> = [
    {
      label: "Questions to ask",
      name: "questions_to_ask",
      placeholder: "What is the main issue?",
      value: config.knowledgeBase.questionsToAsk,
    },
    {
      label: "Required customer information",
      name: "required_customer_information",
      placeholder: "Name, phone number, reason for call",
      value: config.knowledgeBase.requiredCustomerInformation,
    },
    {
      label: "Emergency rules",
      name: "emergency_rules",
      placeholder: "Severe pain or swelling should be escalated the same day.",
      value: config.emergencyRules,
    },
    {
      label: "Knowledge prompts",
      name: "knowledge_prompts",
      placeholder: "Use the uploaded business knowledge and keep the reply short.",
      value: config.knowledgeBase.prompts,
    },
    {
      label: "Knowledge documents",
      name: "knowledge_documents",
      placeholder: "Emergency policy",
      value: config.knowledgeBase.documents,
    },
    {
      label: "Knowledge policies",
      name: "knowledge_policies",
      placeholder: "Do not promise fixed pricing without assessment.",
      value: config.knowledgeBase.policies,
    },
  ];
  const notificationFields: Array<{
    checked: boolean;
    label: string;
    name: string;
  }> = [
    { checked: config.notificationSettings.sms, label: "SMS", name: "notify_sms" },
    { checked: config.notificationSettings.email, label: "Email", name: "notify_email" },
    { checked: config.notificationSettings.inApp, label: "In app", name: "notify_in_app" },
    { checked: config.notificationSettings.whatsapp, label: "WhatsApp", name: "notify_whatsapp" },
    { checked: config.notificationSettings.highPriorityMissedCalls, label: "High priority missed calls", name: "notify_high_priority" },
    { checked: config.notificationSettings.workflowFailures, label: "Workflow failures", name: "notify_workflow_failures" },
    { checked: config.notificationSettings.weeklyOwnerReport, label: "Weekly owner report", name: "notify_weekly_report" },
    { checked: config.notificationSettings.lowPriorityReplies, label: "Low priority replies", name: "notify_low_priority" },
  ];
  const readinessChecks =
    (config.businessProfile.businessName ? 1 : 0) +
    (config.branches.length ? 1 : 0) +
    (config.staff.length ? 1 : 0) +
    (config.services.length ? 1 : 0) +
    (config.aiSettings.greeting ? 1 : 0) +
    (config.knowledgeBase.questionsToAsk.length ? 1 : 0) +
    (config.notificationSettings.sms ? 1 : 0) +
    (config.workflowSettings.stages.length ? 1 : 0);
  const computedScore = Math.max(0, Math.min(100, Math.round((readinessChecks / 8) * 100)));
  const configScore = launchState?.score ?? computedScore;
  const launchLabel = launchState?.ready ? "Ready for go-live" : "Needs a few final steps";
  const connectedProviders = providerRegistry.filter((provider) => ["twilio", "google_calendar", "stripe", "email", "webhooks"].includes(provider.key));
  const onboardingSteps: OnboardingStep[] = [
    {
      id: "profile",
      label: "Business profile",
      description: "Business name, contact details, branding, and branch information are saved in the clinic record.",
      status: config.businessProfile.businessName ? "complete" : "current",
    },
    {
      id: "hours",
      label: "Opening hours",
      description: "Weekday, Saturday, Sunday, and holiday hours are persisted for callbacks and escalation.",
      status: config.openingHours.weekdays ? "complete" : "pending",
    },
    {
      id: "team",
      label: "Team and permissions",
      description: "Staff members, roles, and permission guidance are ready for the first customer team.",
      status: config.staff.length ? "complete" : "pending",
    },
    {
      id: "launch",
      label: "Go live",
      description: "The saved launch score and blockers show exactly what still needs attention before the business can open.",
      status: launchState?.ready ? "complete" : "pending",
    },
  ];

  return (
    <SettingsShell
      active="/settings"
      eyebrow="Self-service setup"
      title="Business settings that actually persist"
      description="Owners can configure the business, branding, AI, hours, services, staff, notifications, billing, and go-live readiness without touching SQL or the Supabase editor."
    >
      {message ? (
        <section
          className={`rounded-[20px] border p-4 text-sm font-medium ${
            message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </section>
      ) : null}

      <form action={saveClinicSettingsAction} className="grid gap-6">
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SettingsCard
            eyebrow="Launch readiness"
            title="Go-live control centre"
            description="The current configuration score is based on saved business data, not on demo placeholders."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Configuration score", `${configScore}%`],
                ["Branches", String(config.branches.length)],
                ["Team members", String(config.staff.length)],
                ["Services", String(config.services.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-[#10201d]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/system" className="rounded-full bg-[#087968] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] hover:bg-[#066657]">
                Review readiness
              </Link>
              <Link href="/dashboard" className="rounded-full border border-[#cdd8d5] bg-white px-4 py-2.5 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
                Open dashboard
              </Link>
            </div>
            <div className="mt-5 rounded-[18px] border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#10201d]">{launchLabel}</p>
                  <p className={sectionNoteClassName()}>The saved launch state updates every time settings are saved.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold tracking-tight text-[#10201d]">{configScore}%</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Ready score</p>
                </div>
              </div>
              {launchState?.blockers?.length ? (
                <div className="mt-4 grid gap-2">
                  {launchState.blockers.slice(0, 4).map((blocker) => (
                    <p key={blocker} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                      {blocker}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-[#c8eee6] bg-[#f7fffd] px-3 py-2 text-sm font-medium text-[#087968]">
                  No configuration blockers remain for the saved settings.
                </p>
              )}
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Business" title="Core company details" description="These values feed the workspace, brand, dashboard labels, and launch readiness checks.">
            <div className="grid gap-3">
              {[
                ["business_name", "Business name", config.businessProfile.businessName, "ClinicFlow Dental"],
                ["business_description", "Business description", config.businessProfile.businessDescription, "Premium private dental reception and recovery platform."],
                ["owner_name", "Owner name", config.businessProfile.ownerName, "Clinic owner"],
                ["owner_email", "Owner email", config.businessProfile.ownerEmail, "owner@clinicflow-demo.co.uk"],
                ["business_email", "Business email", config.businessProfile.businessEmail, "hello@clinicflow-demo.co.uk"],
                ["business_phone", "Primary phone", config.businessProfile.businessPhone, "+44 20 7946 1020"],
                ["business_website", "Website", config.businessProfile.businessWebsite, "clinicflow-demo.co.uk"],
                ["timezone", "Timezone", config.businessProfile.timezone, "Europe/London"],
                ["active_branch", "Active branch", config.businessProfile.activeBranch, "Marylebone"],
              ].map(([name, label, value, placeholder]) => (
                <label key={name} className="grid gap-2 text-sm font-medium text-[#394642]">
                  {label}
                  <input name={name} defaultValue={String(value ?? "")} placeholder={String(placeholder)} className={inputClassName()} />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Phone numbers
                <textarea
                  name="phone_numbers"
                  defaultValue={config.businessProfile.phoneNumbers.join("\n")}
                  placeholder="+44 20 7946 1020
+44 20 7946 1021"
                  className={textareaClassName()}
                />
                <span className={sectionNoteClassName()}>One number per line. The first number becomes the primary clinic phone.</span>
              </label>
            </div>
          </SettingsCard>
        </section>

        <section className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-full border border-[#dbe6e2] bg-white px-4 py-2 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#c8eee6] hover:bg-[#f8fffd]"
            >
              {section.label}
            </Link>
          ))}
        </section>

        <section id="hours" className="grid gap-6 lg:grid-cols-2">
          <SettingsCard eyebrow="Opening hours" title="Business and holiday hours" description="These rules shape callbacks, after-hours wording, and emergency escalation.">
            <div className="grid gap-3">
              {[
                ["hours_weekdays", "Weekdays", config.openingHours.weekdays, "08:00 - 18:30"],
                ["hours_saturday", "Saturday", config.openingHours.saturday, "09:00 - 13:00"],
                ["hours_sunday", "Sunday", config.openingHours.sunday, "Closed"],
                ["holiday_hours", "Holiday hours", config.openingHours.holidayHours, "Configured by admin"],
                ["hours_weekend_notes", "Weekend notes", config.openingHours.weekendNotes, "Emergency routing only"],
              ].map(([name, label, value, placeholder]) => (
                <label key={name} className="grid gap-2 text-sm font-medium text-[#394642]">
                  {label}
                  <input name={name} defaultValue={String(value ?? "")} placeholder={String(placeholder)} className={inputClassName()} />
                </label>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Branches" title="Locations and branch contacts" description="One branch per line in the format: name | address | phone | notes.">
            <label className="grid gap-2 text-sm font-medium text-[#394642]">
              Branch list
              <textarea
                name="branches"
                defaultValue={formatBranchList(config.branches)}
                placeholder="Marylebone | 10 Harley Street, London | +44 20 7946 1020 | Primary branch"
                className={textareaClassName()}
              />
            </label>
          </SettingsCard>
        </section>

        <section id="branding" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <SettingsCard eyebrow="Branding" title="ClinicFlow presentation" description="Colours and wording stay consistent across the app, public site, and live dashboards.">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["logo", "Logo", config.branding.logo, "CF"],
                ["brand_tagline", "Tagline", config.branding.tagline, "Never miss a patient again"],
                ["primary_colour", "Primary colour", config.branding.primaryColour, "#087968"],
                ["secondary_colour", "Secondary colour", config.branding.secondaryColour, "#10201d"],
                ["accent", "Accent", config.branding.accent, "teal"],
                ["background_colour", "Background colour", config.branding.backgroundColour, "#f7faf9"],
                ["surface_colour", "Surface colour", config.branding.surfaceColour, "#ffffff"],
                ["text_colour", "Text colour", config.branding.textColour, "#10201d"],
                ["brand_tone", "Tone", config.branding.tone, "Premium, warm, calm, British"],
              ].map(([name, label, value, placeholder]) => (
                <label key={name} className="grid gap-2 text-sm font-medium text-[#394642]">
                  {label}
                  <input name={name} defaultValue={String(value ?? "")} placeholder={String(placeholder)} className={inputClassName()} />
                </label>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Services and pricing" title="What the practice offers" description="Service lines and pricing notes persist here so the owner can tune recovery and booking.">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Services
                <textarea
                  name="services"
                  defaultValue={formatServiceList(config.services)}
                  placeholder="Check-up | Routine examination and advice | From £95 | Routine"
                  className={textareaClassName()}
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[#394642]">
                  Consultation fee
                  <input name="pricing_consultation_fee" defaultValue={config.pricing.consultationFee} className={inputClassName()} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#394642]">
                  Emergency fee
                  <input name="pricing_emergency_fee" defaultValue={config.pricing.emergencyFee} className={inputClassName()} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#394642]">
                  Pricing notes
                  <input name="pricing_notes" defaultValue={config.pricing.notes} className={inputClassName()} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#394642]">
                  Quote policy
                  <input name="pricing_quote_policy" defaultValue={config.pricing.quotePolicy} className={inputClassName()} />
                </label>
              </div>
            </div>
          </SettingsCard>
        </section>

        <section id="ai" className="grid gap-6 lg:grid-cols-2">
          <SettingsCard eyebrow="AI" title="Reception intelligence" description="Adjust the greeting, tone, and safe-response behaviour the receptionist should use.">
            <div className="grid gap-3">
              {[
                ["ai_greeting", "Greeting", config.aiSettings.greeting, "Hello, you’ve reached ClinicFlow Dental. How can I help today?"],
                ["voice_personality", "Voice personality", config.aiSettings.voicePersonality, "Warm, professional, calm, British"],
                ["ai_prompt", "AI prompt", config.aiSettings.prompt, "Use safe, concise, clinic-friendly language and escalate emergencies."],
                ["ai_after_hours", "After-hours wording", config.aiSettings.afterHours, "Tell the caller you’ll make a note and the team will follow up."],
                ["ai_human_transfer", "Human transfer wording", config.aiSettings.humanTransfer, "Offer a warm transfer to reception when requested."],
                ["ai_faq_behaviour", "FAQ behaviour", config.aiSettings.faqBehaviour, "Stay brief and offer a callback when unsure."],
                ["voice", "Voice", config.aiSettings.voice, "Polly.Amy-Neural"],
                ["speech_rate", "Speech rate", config.aiSettings.speechRate, "95%"],
                ["ai_language", "Language", config.aiSettings.language, "en-GB"],
              ].map(([name, label, value, placeholder]) => (
                <label key={name} className="grid gap-2 text-sm font-medium text-[#394642]">
                  {label}
                  {name === "ai_prompt" || name === "ai_after_hours" || name === "ai_human_transfer" || name === "ai_faq_behaviour" || name === "voice_personality" || name === "ai_greeting" ? (
                    <textarea name={name} defaultValue={String(value ?? "")} placeholder={String(placeholder)} className={textareaClassName()} />
                  ) : (
                    <input name={name} defaultValue={String(value ?? "")} placeholder={String(placeholder)} className={inputClassName()} />
                  )}
                </label>
              ))}
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm font-medium text-[#394642]">
                Enable SSML
                <input name="ssml_enabled" type="checkbox" defaultChecked={config.aiSettings.ssmlEnabled} className="size-4 accent-[#087968]" />
              </label>
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Knowledge" title="Business rules and reference material" description="These rules power the triage and summary engine without exposing raw database rows.">
            <div className="grid gap-3">
              {knowledgeFields.map((field) => (
                <label key={field.name} className="grid gap-2 text-sm font-medium text-[#394642]">
                  {field.label}
                  <textarea
                    name={field.name}
                    defaultValue={formatLines(field.value)}
                    placeholder={field.placeholder}
                    className={textareaClassName()}
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Knowledge summary
                <textarea name="knowledge_summary" defaultValue={config.knowledgeBase.summary} className={textareaClassName()} />
              </label>
            </div>
          </SettingsCard>
        </section>

        <section id="notifications" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SettingsCard eyebrow="Notifications" title="How the owner and team are alerted" description="Choose the channels that receive urgent missed-call, workflow, and weekly summary alerts.">
            <div className="grid gap-3 md:grid-cols-2">
              {notificationFields.map((field) => (
                <label key={field.name} className="flex items-center justify-between gap-4 rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm font-medium text-[#394642]">
                  {field.label}
                  <input name={field.name} type="checkbox" defaultChecked={field.checked} className="size-4 accent-[#087968]" />
                </label>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Workflow" title="What happens after a call" description="Stages, cadence, and escalation rules keep the workflow engine aligned with the practice.">
            <div className="grid gap-3">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm font-medium text-[#394642]">
                Active
                <input name="workflow_active" type="checkbox" defaultChecked={config.workflowSettings.active} className="size-4 accent-[#087968]" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Booking behaviour
                <textarea name="workflow_booking_behaviour" defaultValue={config.workflowSettings.bookingBehaviour} className={textareaClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Calendar provider
                <input name="workflow_calendar_provider" defaultValue={config.workflowSettings.calendarProvider} className={inputClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Follow-up cadence
                <input name="workflow_follow_up_cadence" defaultValue={config.workflowSettings.followUpCadence} className={inputClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Escalation rules
                <textarea
                  name="workflow_escalation_rules"
                  defaultValue={formatLines(config.workflowSettings.escalationRules)}
                  placeholder="Urgent / Complaint / Breathing issues"
                  className={textareaClassName()}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Workflow stages
                <textarea
                  name="workflow_stages"
                  defaultValue={formatLines(config.workflowSettings.stages)}
                  placeholder="received
triaged
followed_up
booked
closed"
                  className={textareaClassName()}
                />
              </label>
            </div>
          </SettingsCard>
        </section>

        <section id="team" className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <SettingsCard eyebrow="Team" title="Staff and access model" description="Staff is stored with the business config while platform roles and permissions remain consistent with the app.">
            <label className="grid gap-2 text-sm font-medium text-[#394642]">
              Staff members
              <textarea
                name="staff"
                defaultValue={formatStaffList(config.staff)}
                placeholder="Maya Shah | maya@clinicflow-demo.co.uk | admin | Marylebone | active"
                className={textareaClassName()}
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-[#65736f]">One line per person: name | email | role | branch | status.</p>
          </SettingsCard>

          <SettingsCard eyebrow="Roles" title="Role and permission model" description="The system role matrix is fixed, but the clinic can still see and review the access model that applies.">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Roles
                <textarea name="roles" defaultValue={formatLines(config.roles)} className={textareaClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Permissions
                <textarea name="permissions" defaultValue={formatLines(config.permissions)} className={textareaClassName()} />
              </label>
              <div className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="text-sm font-semibold text-[#10201d]">Built-in role matrix</p>
                <div className="mt-3 grid gap-2">
                  {enterpriseSettingsDemo.permissionMatrix.map((row) => (
                    <div key={row.role} className="rounded-xl border border-[#edf2f0] bg-white px-3 py-2 text-sm text-[#394642]">
                      <span className="font-semibold text-[#10201d]">{row.role}</span> - {row.permissions.length} permissions
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SettingsCard>
        </section>

        <section id="billing" className="grid gap-6 lg:grid-cols-2">
          <SettingsCard eyebrow="Billing" title="Billing preferences and subscription" description="Keep the commercial model visible while Stripe remains optional.">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["billing_plan_key", "Plan key", config.billingPreferences.planKey],
                ["subscription_status", "Subscription status", config.subscription.status],
                ["subscription_plan", "Subscription plan", config.subscription.plan],
                ["billing_cycle", "Billing cycle", config.billingPreferences.cycle],
                ["billing_seats", "Seats", config.billingPreferences.seats],
                ["billing_currency", "Currency", config.billingPreferences.currency],
                ["billing_invoicing", "Invoicing", config.billingPreferences.invoicing],
                ["billing_payment_terms", "Payment terms", config.billingPreferences.paymentTerms],
                ["billing_tax_mode", "Tax mode", config.billingPreferences.taxMode],
                ["subscription_renewal", "Renewal date", config.subscription.renewal],
                ["subscription_trial_ends", "Trial end date", config.subscription.trialEndsAt],
              ].map(([name, label, value]) => (
                <label key={name} className="grid gap-2 text-sm font-medium text-[#394642]">
                  {label}
                  <input name={name} defaultValue={String(value ?? "")} className={inputClassName()} />
                </label>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Customer" title="Customer detail and reporting preferences" description="These tags and preferences help the platform shape the first-customer workflow.">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Customer tags
                <textarea name="customer_tags" defaultValue={formatLines(config.customerDetails.tags)} className={textareaClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Lead categories
                <textarea name="lead_categories" defaultValue={formatLines(config.customerDetails.leadCategories)} className={textareaClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Report preferences
                <input name="customer_report_preferences" defaultValue={config.customerDetails.reportPreferences} className={inputClassName()} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Contact preferences
                <input name="customer_contact_preferences" defaultValue={config.customerDetails.contactPreferences} className={inputClassName()} />
              </label>
            </div>
          </SettingsCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SettingsCard eyebrow="Onboarding" title="Saved launch summary" description="This is what the readiness engine will use when a non-technical owner comes back later.">
            <OnboardingProgress steps={onboardingSteps} />
          </SettingsCard>

          <SettingsCard eyebrow="Audit" title="Recent activity" description="The owner should see a calm activity trail while the new settings are being rolled out.">
            <ActivityList items={auditItems} />
          </SettingsCard>
        </section>

        <section id="launch" className="rounded-[28px] border border-[#dce6e3] bg-white p-6 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Go live</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Save the business configuration and refresh readiness</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65736f]">
                This single save writes the clinic configuration back to Supabase and updates the launch score that drives the first-customer
                dashboard.
              </p>
            </div>
            <div className="rounded-[20px] border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Configured score</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#10201d]">{configScore}%</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <SettingsSubmitButton label="Save business settings" />
            <Link href="/system" className="rounded-full border border-[#cdd8d5] bg-white px-5 py-3 text-sm font-semibold text-[#10201d] shadow-sm hover:border-[#9db2ad]">
              Review production readiness
            </Link>
          </div>

          <p className="mt-4 text-xs leading-6 text-[#7b8a85]">
            Connected platform services: {connectedProviders.map((provider) => provider.name).join(", ")}.
          </p>
        </section>
      </form>
    </SettingsShell>
  );
}
