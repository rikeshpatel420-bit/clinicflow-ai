"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CopyValueButton } from "@/components/integrations/copy-value-button";
import { createClinicAction, initialOnboardingState } from "./actions";
import type { OnboardingGeneratedPackage, OnboardingHealthCheck } from "@/lib/onboarding";

function fieldClassName() {
  return "rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm text-[#10201d] outline-none transition focus:border-[#18b7a0] focus:bg-white focus:ring-2 focus:ring-[#c6f1e7]";
}

function textareaClassName() {
  return `${fieldClassName()} min-h-[118px]`;
}

function sectionClassName() {
  return "rounded-[28px] border border-[#dce6e3] bg-white p-5 shadow-[0_18px_60px_rgba(16,33,29,0.06)]";
}

function labelClassName() {
  return "grid gap-2 text-sm font-medium text-[#394642]";
}

function statusClassName(status: OnboardingHealthCheck["status"]) {
  if (status === "complete") return "border-[#c8eee6] bg-[#f7fffd] text-[#087968]";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-700";
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#087968] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] transition hover:bg-[#066657] disabled:cursor-not-allowed disabled:bg-[#9fb8b2]"
    >
      {pending ? "Generating business..." : "Generate business setup"}
    </button>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#10201d]">{value}</p>
    </div>
  );
}

function SummaryList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-2 text-sm text-[#52615d]">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
          <dt className="font-medium">{item.label}</dt>
          <dd className="max-w-[18rem] text-right font-semibold text-[#10201d]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function OnboardingSection({ title, description, items }: OnboardingGeneratedPackage["brandEngine"]) {
  return (
    <section className={sectionClassName()}>
      <p className="text-sm font-semibold text-[#087968]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#65736f]">{description}</p>
      <div className="mt-4">
        <SummaryList items={items} />
      </div>
    </section>
  );
}

function HealthSection({ checks, completeCount, score, missing, ready }: OnboardingGeneratedPackage["platformHealth"]) {
  return (
    <section className={sectionClassName()}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#087968]">Platform health</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">{ready ? "Ready to launch" : "Needs attention"}</h2>
          <p className="mt-2 text-sm leading-6 text-[#65736f]">
            This self-check confirms whether the new business setup is complete enough to go live.
          </p>
        </div>
        <div className="grid min-w-[10rem] gap-2 rounded-3xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">Score</span>
            <span className="text-xl font-semibold text-[#10201d]">{score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e8efed]">
            <div className="h-full rounded-full bg-[#087968]" style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-[#65736f]">{completeCount} checks complete</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {checks.map((check) => (
          <div key={check.id} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-[#10201d]">{check.label}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(check.status)}`}>{check.value}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">{check.detail}</p>
          </div>
        ))}
      </div>
      {missing.length > 0 ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing: {missing.join(", ")}
        </p>
      ) : (
        <p className="mt-4 rounded-2xl border border-[#c8eee6] bg-[#f7fffd] px-4 py-3 text-sm font-medium text-[#087968]">
          All onboarding checks are satisfied.
        </p>
      )}
    </section>
  );
}

function GeneratedPreview({ generated }: { generated: OnboardingGeneratedPackage }) {
  return (
    <div className="grid gap-6">
      <section className={sectionClassName()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Generated business package</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">{generated.blueprint.businessName}</h2>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">
              The onboarding engine generates the organisation, brand, prompt, knowledge, booking, settings, and validation layers from
              the same configuration.
            </p>
          </div>
          <CopyValueButton value={JSON.stringify(generated, null, 2)} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Profile ID" value={generated.generatedProfile.profileId} />
          <ResultCard label="Industry" value={generated.blueprint.industry} />
          <ResultCard label="Voice" value={generated.generatedProfile.voice.voice} />
          <ResultCard label="Language" value={generated.generatedProfile.voice.language} />
          <ResultCard label="Workflow stages" value={String(generated.generatedProfile.workflowStages.length)} />
          <ResultCard label="Routes generated" value={String(generated.generatedProfile.routes.length)} />
        </div>
      </section>

      <OnboardingSection {...generated.brandEngine} />
      <OnboardingSection {...generated.promptStudio} />
      <OnboardingSection {...generated.knowledgeBase} />
      <OnboardingSection {...generated.bookingAbstraction} />
      <OnboardingSection {...generated.organisationModel} />
      <OnboardingSection {...generated.settingsEngine} />
      <HealthSection {...generated.platformHealth} />

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Generated assets</p>
        <p className="mt-2 text-sm leading-6 text-[#65736f]">
          The same configuration also produces dashboard labels, route suggestions, documentation, and smoke tests so the business can be
          launched without engineering a separate setup flow.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Dashboard labels" value="Generated" />
          <ResultCard label="Documentation" value={`${generated.generatedProfile.files.length} files`} />
          <ResultCard label="Smoke tests" value="Generated" />
          <ResultCard label="Voice profile" value={generated.generatedProfile.voice.voice} />
        </div>
        <div className="mt-4 rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
          <p className="text-sm font-semibold text-[#10201d]">Package preview</p>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-[#edf2f0] bg-white p-4 text-xs leading-5 text-[#394642]">
            {generated.generatedProfile.documentation}
          </pre>
        </div>
      </section>
    </div>
  );
}

export function BusinessOnboardingWizard({ defaultPackage }: { defaultPackage: OnboardingGeneratedPackage }) {
  const [state, formAction] = useActionState(createClinicAction, initialOnboardingState);
  const generated = state.generated ?? defaultPackage;
  const ready = generated.platformHealth.ready;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <form action={formAction} className="grid gap-6">
        <section className="rounded-[28px] border border-[#dce6e3] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf9_100%)] p-6 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Business onboarding</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#10201d] sm:text-4xl">Create a new business from one configuration.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#65736f]">
                Fill in the wizard once. ClinicFlow generates the brand engine, prompt studio, calendar abstraction, settings engine, and
                self-validation package for the new business.
              </p>
            </div>
            <div className="grid gap-2 rounded-[24px] border border-[#edf2f0] bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-[#10201d]">{ready ? "Ready" : "Build in progress"}</span>
              <span className="text-[#65736f]">{generated.platformHealth.completeCount}/{generated.platformHealth.checks.length} checks complete</span>
            </div>
          </div>
        </section>

        {state.message ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-medium ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{state.message}</p>
              {state.status === "success" ? (
                <Link href="/dashboard" className="rounded-full bg-[#087968] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066657]">
                  Go to dashboard
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Organisation model</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={labelClassName()}>
              Business name
              <input name="business_name" defaultValue={generated.blueprint.businessName} className={fieldClassName()} required />
            </label>
            <label className={labelClassName()}>
              Industry
              <input name="industry" defaultValue={generated.blueprint.industry} className={fieldClassName()} required />
            </label>
            <label className={labelClassName()}>
              Owner name
              <input name="owner_name" defaultValue={generated.blueprint.ownerName} className={fieldClassName()} required />
            </label>
            <label className={labelClassName()}>
              Owner email
              <input name="owner_email" type="email" defaultValue={generated.blueprint.ownerEmail} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Business email
              <input name="business_email" type="email" defaultValue={generated.blueprint.businessEmail} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Business phone
              <input name="business_phone" type="tel" defaultValue={generated.blueprint.businessPhone} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Website
              <input name="business_website" type="url" defaultValue={generated.blueprint.businessWebsite} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Timezone
              <input name="timezone" defaultValue={generated.blueprint.timezone} className={fieldClassName()} />
            </label>
            <label className="md:col-span-2 grid gap-2 text-sm font-medium text-[#394642]">
              Business address
              <textarea name="business_address" defaultValue={generated.blueprint.businessAddress} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              Business hours
              <input name="business_hours" defaultValue={generated.blueprint.businessHours} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Service radius (miles)
              <input name="service_radius_miles" defaultValue={generated.blueprint.serviceRadiusMiles} className={fieldClassName()} />
            </label>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Brand engine</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={labelClassName()}>
              Logo
              <input name="logo" defaultValue={generated.blueprint.logo} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Accent
              <select name="accent" defaultValue={generated.blueprint.colours.accent} className={fieldClassName()}>
                {["teal", "blue", "green", "amber", "violet", "rose"].map((accent) => (
                  <option key={accent} value={accent}>
                    {accent}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName()}>
              Primary
              <input name="primary_colour" defaultValue={generated.blueprint.colours.primary} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Secondary
              <input name="secondary_colour" defaultValue={generated.blueprint.colours.secondary} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Background
              <input name="background_colour" defaultValue={generated.blueprint.colours.background} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Surface
              <input name="surface_colour" defaultValue={generated.blueprint.colours.surface} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Text
              <input name="text_colour" defaultValue={generated.blueprint.colours.text} className={fieldClassName()} />
            </label>
            <label className={labelClassName()}>
              Tone
              <input name="tone" defaultValue={generated.blueprint.tone} className={fieldClassName()} />
            </label>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Prompt studio</p>
          <div className="mt-4 grid gap-4">
            <label className={labelClassName()}>
              Greeting
              <textarea name="greeting" defaultValue={generated.blueprint.greeting} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              Voice personality
              <textarea name="voice_personality" defaultValue={generated.blueprint.voicePersonality} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              AI prompt
              <textarea name="ai_prompt" defaultValue={generated.blueprint.aiPrompt} className={textareaClassName()} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName()}>
                Voice
                <input name="voice" defaultValue={generated.blueprint.voice ?? "Polly.Amy-Neural"} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Speech rate
                <input name="speech_rate" defaultValue={generated.blueprint.speechRate ?? "95%"} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Language
                <input name="language" defaultValue={generated.blueprint.language ?? "en-GB"} className={fieldClassName()} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm font-medium text-[#394642]">
                Enable SSML
                <input name="ssml_enabled" type="checkbox" defaultChecked={generated.blueprint.ssmlEnabled ?? true} className="size-4 accent-[#087968]" />
              </label>
            </div>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Knowledge base and booking abstraction</p>
          <div className="mt-4 grid gap-4">
            <label className={labelClassName()}>
              Questions to ask
              <textarea name="questions_to_ask" defaultValue={generated.blueprint.questionsToAsk.join("\n")} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              Required customer information
              <textarea
                name="required_customer_information"
                defaultValue={generated.blueprint.requiredCustomerInformation.join("\n")}
                className={textareaClassName()}
              />
            </label>
            <label className={labelClassName()}>
              Emergency rules
              <textarea name="emergency_rules" defaultValue={generated.blueprint.emergencyRules.join("\n")} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              Booking behaviour
              <textarea name="booking_behaviour" defaultValue={generated.blueprint.bookingBehaviour} className={textareaClassName()} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName()}>
                Calendar provider
                <input name="calendar_provider" defaultValue={generated.blueprint.calendarProvider} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Follow-up cadence
                <input name="follow_up_cadence" defaultValue={generated.blueprint.followUpCadence} className={fieldClassName()} />
              </label>
            </div>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Settings engine</p>
          <div className="mt-4 grid gap-4">
            <label className={labelClassName()}>
              Escalation rules
              <textarea name="escalation_rules" defaultValue={generated.blueprint.escalationRules.join("\n")} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              CRM fields
              <textarea name="crm_fields" defaultValue={generated.blueprint.crmFields.join("\n")} className={textareaClassName()} />
            </label>
            <label className={labelClassName()}>
              Workflow stages
              <textarea name="workflow_stages" defaultValue={generated.blueprint.workflowStages.join("\n")} className={textareaClassName()} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName()}>
                Dashboard active calls
                <input name="dashboard_active_calls" defaultValue={generated.blueprint.dashboardWording.activeCalls} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Dashboard follow-up
                <input name="dashboard_follow_up" defaultValue={generated.blueprint.dashboardWording.followUp} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Dashboard missed calls
                <input name="dashboard_missed_calls" defaultValue={generated.blueprint.dashboardWording.missedCalls} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Dashboard recovery
                <input name="dashboard_recovery" defaultValue={generated.blueprint.dashboardWording.recovery} className={fieldClassName()} />
              </label>
              <label className={labelClassName()}>
                Revenue wording
                <input
                  name="dashboard_revenue_recovered"
                  defaultValue={generated.blueprint.dashboardWording.revenueRecovered}
                  className={fieldClassName()}
                />
              </label>
              <label className={labelClassName()}>
                Response rate wording
                <input name="dashboard_response_rate" defaultValue={generated.blueprint.dashboardWording.responseRate} className={fieldClassName()} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClassName()}>
                SMS recovery
                <textarea name="sms_missed_call_recovery" defaultValue={generated.blueprint.smsTemplates.missedCallRecovery} className={textareaClassName()} />
              </label>
              <label className={labelClassName()}>
                SMS reply yes
                <textarea name="sms_reply_yes" defaultValue={generated.blueprint.smsTemplates.replyYes} className={textareaClassName()} />
              </label>
              <label className={labelClassName()}>
                SMS opt-out
                <textarea name="sms_opt_out" defaultValue={generated.blueprint.smsTemplates.optOut} className={textareaClassName()} />
              </label>
              <label className={labelClassName()}>
                SMS resubscribe
                <textarea name="sms_resubscribe" defaultValue={generated.blueprint.smsTemplates.resubscribe} className={textareaClassName()} />
              </label>
              <label className={labelClassName()}>
                SMS help
                <textarea name="sms_help" defaultValue={generated.blueprint.smsTemplates.help} className={textareaClassName()} />
              </label>
              <label className={labelClassName()}>
                Email subject
                <input name="email_subject" defaultValue={generated.blueprint.emailTemplates.subject} className={fieldClassName()} />
              </label>
              <label className="md:col-span-2 grid gap-2 text-sm font-medium text-[#394642]">
                Email body
                <textarea name="email_body" defaultValue={generated.blueprint.emailTemplates.body} className={textareaClassName()} />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#dce6e3] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf9_100%)] p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Generate</p>
              <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Create the business package</h2>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">
                The platform will create the workspace, mark onboarding complete, and return the generated configuration package.
              </p>
            </div>
            <SubmitButton />
          </div>
        </section>
      </form>

      <aside className="grid gap-6">
        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Generated output</p>
          <p className="mt-2 text-sm leading-6 text-[#65736f]">
            This preview updates after generation and shows the platform package that would be created for the new business.
          </p>
        </section>
        <GeneratedPreview generated={generated} />
      </aside>
    </div>
  );
}
