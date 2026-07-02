"use server";

import { redirect } from "next/navigation";
import { generateFlowFactoryPackage, getFlowFactoryBlueprintDefaults, type FlowFactoryBlueprint, type FlowFactoryGeneratedProfile } from "@/lib/flow-factory";
import type { FlowBrandAccent } from "@/lib/flow-platform";
import { getCurrentUser } from "@/lib/supabase/server";

export type FlowFactoryWizardState = {
  generated?: FlowFactoryGeneratedProfile;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialFlowFactoryState: FlowFactoryWizardState = {
  status: "idle",
};

function getString(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? "").trim() || fallback;
}

function getLines(formData: FormData, key: string, fallback: string[]) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return fallback;

  return raw
    .split(/\r?\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getAccent(value: string, fallback: FlowBrandAccent): FlowBrandAccent {
  const allowed: FlowBrandAccent[] = ["teal", "blue", "green", "amber", "violet", "rose"];
  return allowed.includes(value as FlowBrandAccent) ? (value as FlowBrandAccent) : fallback;
}

export async function generateFlowFactoryAction(_previousState: FlowFactoryWizardState, formData: FormData): Promise<FlowFactoryWizardState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/factory");
  }

  const defaults = getFlowFactoryBlueprintDefaults();

  const blueprint: FlowFactoryBlueprint = {
    aiPrompt: getString(formData, "ai_prompt", defaults.aiPrompt),
    bookingBehaviour: getString(formData, "booking_behaviour", defaults.bookingBehaviour),
    calendarProvider: getString(formData, "calendar_provider", defaults.calendarProvider),
    businessName: getString(formData, "business_name", defaults.businessName),
    colours: {
      accent: getAccent(getString(formData, "accent", defaults.colours.accent), defaults.colours.accent),
      background: getString(formData, "background_colour", defaults.colours.background),
      primary: getString(formData, "primary_colour", defaults.colours.primary),
      secondary: getString(formData, "secondary_colour", defaults.colours.secondary),
      surface: getString(formData, "surface_colour", defaults.colours.surface),
      text: getString(formData, "text_colour", defaults.colours.text),
    },
    crmFields: getLines(formData, "crm_fields", defaults.crmFields),
    dashboardWording: {
      activeCalls: getString(formData, "dashboard_active_calls", defaults.dashboardWording.activeCalls),
      followUp: getString(formData, "dashboard_follow_up", defaults.dashboardWording.followUp),
      missedCalls: getString(formData, "dashboard_missed_calls", defaults.dashboardWording.missedCalls),
      recovery: getString(formData, "dashboard_recovery", defaults.dashboardWording.recovery),
      revenueRecovered: getString(formData, "dashboard_revenue_recovered", defaults.dashboardWording.revenueRecovered),
      responseRate: getString(formData, "dashboard_response_rate", defaults.dashboardWording.responseRate),
    },
    emailTemplates: {
      body: getString(formData, "email_body", defaults.emailTemplates.body),
      subject: getString(formData, "email_subject", defaults.emailTemplates.subject),
    },
    emergencyRules: getLines(formData, "emergency_rules", defaults.emergencyRules),
    escalationRules: getLines(formData, "escalation_rules", defaults.escalationRules),
    followUpCadence: getString(formData, "follow_up_cadence", defaults.followUpCadence),
    greeting: getString(formData, "greeting", defaults.greeting),
    industry: getString(formData, "industry", defaults.industry),
    language: getString(formData, "language", defaults.language ?? "en-GB"),
    logo: getString(formData, "logo", defaults.logo),
    questionsToAsk: getLines(formData, "questions_to_ask", defaults.questionsToAsk),
    requiredCustomerInformation: getLines(formData, "required_customer_information", defaults.requiredCustomerInformation),
    smsTemplates: {
      help: getString(formData, "sms_help", defaults.smsTemplates.help),
      missedCallRecovery: getString(formData, "sms_missed_call_recovery", defaults.smsTemplates.missedCallRecovery),
      optOut: getString(formData, "sms_opt_out", defaults.smsTemplates.optOut),
      replyYes: getString(formData, "sms_reply_yes", defaults.smsTemplates.replyYes),
      resubscribe: getString(formData, "sms_resubscribe", defaults.smsTemplates.resubscribe),
    },
    tone: getString(formData, "tone", defaults.tone),
    voice: getString(formData, "voice", defaults.voice ?? "Polly.Amy-Neural"),
    voicePersonality: getString(formData, "voice_personality", defaults.voicePersonality),
    workflowStages: getLines(formData, "workflow_stages", defaults.workflowStages),
    ssmlEnabled: formData.get("ssml_enabled") === "on",
    speechRate: getString(formData, "speech_rate", defaults.speechRate ?? "95%"),
  };

  if (!blueprint.businessName || !blueprint.industry || !blueprint.greeting || !blueprint.aiPrompt) {
    return {
      status: "error",
      message: "Please complete the business name, industry, greeting, and AI prompt before generating a package.",
    };
  }

  const generated = generateFlowFactoryPackage(blueprint);

  return {
    generated,
    message: `Generated ${generated.profileId} with ${generated.files.length} artifacts and ${generated.routes.length} route suggestions.`,
    status: "success",
  };
}
