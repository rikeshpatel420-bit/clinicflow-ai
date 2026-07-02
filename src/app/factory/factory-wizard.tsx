"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CopyValueButton } from "@/components/integrations/copy-value-button";
import { generateFlowFactoryAction, initialFlowFactoryState } from "./actions";
import type { FlowFactoryBlueprint, FlowFactoryGeneratedProfile } from "@/lib/flow-factory";

function fieldClassName() {
  return "rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm text-[#10201d] outline-none transition focus:border-[#18b7a0] focus:bg-white focus:ring-2 focus:ring-[#c6f1e7]";
}

function textareaClassName() {
  return `${fieldClassName()} min-h-[120px]`;
}

function sectionClassName() {
  return "rounded-[28px] border border-[#dce6e3] bg-white p-5 shadow-[0_18px_60px_rgba(16,33,29,0.06)]";
}

function gridLabelClassName() {
  return "grid gap-2 text-sm font-medium text-[#394642]";
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#087968] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] transition hover:bg-[#066657] disabled:cursor-not-allowed disabled:bg-[#9fb8b2]"
    >
      {pending ? "Generating..." : "Generate factory package"}
    </button>
  );
}

function multiline(value: string[]) {
  return value.join("\n");
}

function previewJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function formatKeyLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function GeneratedArtifact({ filename, description, content }: FlowFactoryGeneratedProfile["files"][number]) {
  return (
    <details className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#10201d]">{filename}</p>
          <p className="mt-1 text-xs leading-5 text-[#65736f]">{description}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#087968]">Copyable</span>
      </summary>
      <div className="mt-4 flex justify-end">
        <CopyValueButton value={content} />
      </div>
      <pre className="mt-4 max-h-96 overflow-auto rounded-2xl border border-[#edf2f0] bg-white p-4 text-xs leading-5 text-[#394642]">
        {content}
      </pre>
    </details>
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

function GeneratedPreview({ generated }: { generated: FlowFactoryGeneratedProfile }) {
  return (
    <div className="grid gap-6">
      <section className={sectionClassName()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#087968]">Generated package</p>
            <h2 className="mt-2 text-xl font-semibold text-[#10201d]">{generated.blueprint.businessName}</h2>
            <p className="mt-2 text-sm leading-6 text-[#65736f]">
              The factory produced a configuration-first vertical package ready to register into the Flow Platform.
            </p>
          </div>
          <CopyValueButton value={previewJson(generated)} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Profile ID" value={generated.profileId} />
          <ResultCard label="Industry" value={generated.blueprint.industry} />
          <ResultCard label="Voice" value={generated.voice.voice} />
          <ResultCard label="Language" value={generated.voice.language} />
          <ResultCard label="Workflow stages" value={String(generated.workflowStages.length)} />
          <ResultCard label="Generated files" value={String(generated.files.length)} />
        </div>
      </section>

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Dashboard configuration</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(generated.dashboard.labels).map(([label, value]) => (
            <ResultCard key={label} label={formatKeyLabel(label)} value={value} />
          ))}
        </div>
      </section>

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Voice profile</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Greeting" value={generated.voice.greeting} />
          <ResultCard label="Personality" value={generated.voice.personality} />
          <ResultCard label="Rate" value={generated.voice.rate} />
          <ResultCard label="SSML" value={generated.voice.ssmlEnabled ? "Enabled" : "Disabled"} />
        </div>
      </section>

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Platform defaults</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Navigation items" value={String(generated.platformDefaults.navigation.length)} />
          <ResultCard label="Dashboard cards" value={String(generated.platformDefaults.dashboardCards.length)} />
          <ResultCard label="Notification templates" value={String(generated.platformDefaults.notificationTemplates.length)} />
          <ResultCard label="Workflow blueprints" value={String(generated.platformDefaults.workflowBlueprints.length)} />
        </div>
      </section>

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Workflow stages</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {generated.workflowStages.map((stage) => (
            <span key={stage} className="rounded-full border border-[#dbe6e2] bg-white px-3 py-1 text-xs font-semibold text-[#394642]">
              {stage}
            </span>
          ))}
        </div>
      </section>

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Route plan</p>
        <div className="mt-4 grid gap-3">
          {generated.routes.map((route) => (
            <div key={route.href} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#10201d]">{route.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[#65736f]">{route.description}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#087968]">{route.href}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionClassName()}>
        <p className="text-sm font-semibold text-[#087968]">Generated artifacts</p>
        <div className="mt-4 grid gap-3">
          {generated.files.map((file) => (
            <GeneratedArtifact key={file.filename} {...file} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function FlowFactoryWizard({
  activeProfileId,
  activeProfileName,
  availableProfiles,
  defaultBlueprint,
}: {
  activeProfileId: string;
  activeProfileName: string;
  availableProfiles: number;
  defaultBlueprint: FlowFactoryBlueprint;
}) {
  const [state, formAction] = useActionState(generateFlowFactoryAction, initialFlowFactoryState);

  const messageTone = state.status === "success" ? "success" : state.status === "error" ? "error" : "neutral";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <form action={formAction} className="grid gap-6">
        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Blueprint</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#10201d]">Tell Flow Factory what to generate</h2>
          <p className="mt-2 text-sm leading-6 text-[#65736f]">
            Everything here becomes configuration for a new Flow product. The core platform stays untouched.
          </p>
        </section>

        {state.message ? (
          <section
            className={`rounded-[24px] border p-4 text-sm font-medium ${
              messageTone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : messageTone === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-[#dce6e3] bg-[#fbfdfc] text-[#65736f]"
            }`}
          >
            {state.message}
          </section>
        ) : null}

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Brand and positioning</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={gridLabelClassName()}>
              Business name
              <input name="business_name" defaultValue={defaultBlueprint.businessName} className={fieldClassName()} required />
            </label>
            <label className={gridLabelClassName()}>
              Industry
              <input name="industry" defaultValue={defaultBlueprint.industry} className={fieldClassName()} required />
            </label>
            <label className={gridLabelClassName()}>
              Logo
              <input name="logo" defaultValue={defaultBlueprint.logo} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Calendar provider
              <input name="calendar_provider" defaultValue={defaultBlueprint.calendarProvider} className={fieldClassName()} />
            </label>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={gridLabelClassName()}>
              Accent
              <select name="accent" defaultValue={defaultBlueprint.colours.accent} className={fieldClassName()}>
                {["teal", "blue", "green", "amber", "violet", "rose"].map((accent) => (
                  <option key={accent} value={accent}>
                    {accent}
                  </option>
                ))}
              </select>
            </label>
            <label className={gridLabelClassName()}>
              Primary colour
              <input name="primary_colour" defaultValue={defaultBlueprint.colours.primary} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Secondary colour
              <input name="secondary_colour" defaultValue={defaultBlueprint.colours.secondary} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Background colour
              <input name="background_colour" defaultValue={defaultBlueprint.colours.background} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Surface colour
              <input name="surface_colour" defaultValue={defaultBlueprint.colours.surface} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Text colour
              <input name="text_colour" defaultValue={defaultBlueprint.colours.text} className={fieldClassName()} />
            </label>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Voice and tone</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={gridLabelClassName()}>
              Voice personality
              <textarea name="voice_personality" defaultValue={defaultBlueprint.voicePersonality} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Greeting
              <textarea name="greeting" defaultValue={defaultBlueprint.greeting} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Conversation tone
              <input name="tone" defaultValue={defaultBlueprint.tone} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Voice
              <input name="voice" defaultValue={defaultBlueprint.voice ?? "Polly.Amy-Neural"} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Speech rate
              <input name="speech_rate" defaultValue={defaultBlueprint.speechRate ?? "95%"} className={fieldClassName()} />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#cdd8d5] bg-[#fbfdfc] px-4 py-3 text-sm font-medium text-[#394642]">
              Enable SSML
              <input name="ssml_enabled" type="checkbox" defaultChecked={defaultBlueprint.ssmlEnabled ?? true} className="size-4 accent-[#087968]" />
            </label>
            <label className={gridLabelClassName()}>
              Language
              <input name="language" defaultValue={defaultBlueprint.language ?? "en-GB"} className={fieldClassName()} />
            </label>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Conversation blueprint</p>
          <div className="mt-4 grid gap-4">
            <label className={gridLabelClassName()}>
              Questions to ask
              <textarea name="questions_to_ask" defaultValue={multiline(defaultBlueprint.questionsToAsk)} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Required customer information
              <textarea
                name="required_customer_information"
                defaultValue={multiline(defaultBlueprint.requiredCustomerInformation)}
                className={textareaClassName()}
              />
            </label>
            <label className={gridLabelClassName()}>
              Emergency rules
              <textarea name="emergency_rules" defaultValue={multiline(defaultBlueprint.emergencyRules)} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Booking behaviour
              <textarea name="booking_behaviour" defaultValue={defaultBlueprint.bookingBehaviour} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Follow-up cadence
              <textarea name="follow_up_cadence" defaultValue={defaultBlueprint.followUpCadence} className={textareaClassName()} />
            </label>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Templates and operations</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={gridLabelClassName()}>
              AI prompt
              <textarea name="ai_prompt" defaultValue={defaultBlueprint.aiPrompt} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Escalation rules
              <textarea name="escalation_rules" defaultValue={multiline(defaultBlueprint.escalationRules)} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              SMS - help
              <textarea name="sms_help" defaultValue={defaultBlueprint.smsTemplates.help} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              SMS - missed call recovery
              <textarea name="sms_missed_call_recovery" defaultValue={defaultBlueprint.smsTemplates.missedCallRecovery} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              SMS - opt out
              <textarea name="sms_opt_out" defaultValue={defaultBlueprint.smsTemplates.optOut} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              SMS - reply yes
              <textarea name="sms_reply_yes" defaultValue={defaultBlueprint.smsTemplates.replyYes} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              SMS - resubscribe
              <textarea name="sms_resubscribe" defaultValue={defaultBlueprint.smsTemplates.resubscribe} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Email subject
              <input name="email_subject" defaultValue={defaultBlueprint.emailTemplates.subject} className={fieldClassName()} />
            </label>
            <label className="md:col-span-2 grid gap-2 text-sm font-medium text-[#394642]">
              Email body
              <textarea name="email_body" defaultValue={defaultBlueprint.emailTemplates.body} className={textareaClassName()} />
            </label>
          </div>
        </section>

        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Dashboard and CRM</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className={gridLabelClassName()}>
              Active calls wording
              <input name="dashboard_active_calls" defaultValue={defaultBlueprint.dashboardWording.activeCalls} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Follow-up wording
              <input name="dashboard_follow_up" defaultValue={defaultBlueprint.dashboardWording.followUp} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Missed calls wording
              <input name="dashboard_missed_calls" defaultValue={defaultBlueprint.dashboardWording.missedCalls} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Recovery wording
              <input name="dashboard_recovery" defaultValue={defaultBlueprint.dashboardWording.recovery} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Revenue recovered wording
              <input name="dashboard_revenue_recovered" defaultValue={defaultBlueprint.dashboardWording.revenueRecovered} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Response rate wording
              <input name="dashboard_response_rate" defaultValue={defaultBlueprint.dashboardWording.responseRate} className={fieldClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              CRM fields
              <textarea name="crm_fields" defaultValue={multiline(defaultBlueprint.crmFields)} className={textareaClassName()} />
            </label>
            <label className={gridLabelClassName()}>
              Workflow stages
              <textarea name="workflow_stages" defaultValue={multiline(defaultBlueprint.workflowStages)} className={textareaClassName()} />
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#dce6e3] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf9_100%)] p-5 shadow-[0_24px_100px_rgba(16,33,29,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#087968]">Generate</p>
              <h2 className="mt-2 text-xl font-semibold text-[#10201d]">Create the configuration package</h2>
            </div>
            <SubmitButton />
          </div>
        </section>
      </form>

      <aside className="grid gap-6">
        <section className={sectionClassName()}>
          <p className="text-sm font-semibold text-[#087968]">Platform status</p>
          <div className="mt-4 grid gap-3">
            <ResultCard label="Active profile" value={`${activeProfileName} (${activeProfileId})`} />
            <ResultCard label="Available profiles" value={String(availableProfiles)} />
            <ResultCard label="Factory mode" value="Configuration-first" />
          </div>
          <p className="mt-4 text-sm leading-6 text-[#65736f]">
            Flow Factory produces a new product package that can be registered without changing the shared core platform behaviour.
          </p>
        </section>

        {state.generated ? (
          <GeneratedPreview generated={state.generated} />
        ) : (
          <section className={sectionClassName()}>
            <p className="text-sm font-semibold text-[#087968]">Preview</p>
            <h2 className="mt-2 text-xl font-semibold text-[#10201d]">No package generated yet</h2>
            <p className="mt-3 text-sm leading-6 text-[#65736f]">
              Fill the blueprint fields and generate a package to see the resulting profile ID, route plan, dashboard labels, voice profile,
              and exported artifacts.
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}
