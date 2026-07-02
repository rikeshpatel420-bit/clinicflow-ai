import { generateFlowFactoryPackage, getFlowFactoryBlueprintDefaults } from "@/lib/flow-factory";
import type { FlowFactoryBlueprint } from "@/lib/flow-factory";
import type {
  BusinessOnboardingBlueprint,
  OnboardingActionState,
  OnboardingGeneratedPackage,
  OnboardingHealthCheck,
  OnboardingHealthSummary,
  OnboardingSectionSummary,
} from "./types";

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

function getBoolean(formData: FormData, key: string, fallback = false) {
  const value = formData.get(key);
  if (value === null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

function buildSection(title: string, description: string, items: OnboardingSectionSummary["items"]): OnboardingSectionSummary {
  return {
    description,
    items,
    title,
  };
}

function buildHealthCheck(id: string, label: string, ok: boolean, detail: string): OnboardingHealthCheck {
  return {
    detail,
    id,
    label,
    status: ok ? "complete" : "missing",
    value: ok ? "Complete" : "Missing",
  };
}

function buildOnboardingHealth(blueprint: BusinessOnboardingBlueprint): OnboardingHealthSummary {
  const checks = [
    buildHealthCheck(
      "organisation",
      "Organisation model",
      Boolean(blueprint.businessName && blueprint.industry && blueprint.ownerName && blueprint.ownerEmail && blueprint.businessPhone && blueprint.timezone),
      "Business identity, owner contact details, phone number, and timezone are captured.",
    ),
    buildHealthCheck("brand", "Brand engine", Boolean(blueprint.logo && blueprint.colours.primary && blueprint.colours.secondary), "Logo and brand colours are ready for use."),
    buildHealthCheck("prompt", "Prompt studio", Boolean(blueprint.greeting && blueprint.aiPrompt && blueprint.voicePersonality), "Greeting, voice, and AI prompt are configured."),
    buildHealthCheck("knowledge", "Knowledge base", blueprint.questionsToAsk.length > 0 && blueprint.requiredCustomerInformation.length > 0 && blueprint.emergencyRules.length > 0, "Questions, required data, and emergency rules are captured."),
    buildHealthCheck("booking", "Booking abstraction", Boolean(blueprint.calendarProvider && blueprint.bookingBehaviour && blueprint.businessHours), "Calendar provider and booking behaviour are defined."),
    buildHealthCheck("settings", "Settings engine", blueprint.smsTemplates.missedCallRecovery.length > 0 && blueprint.emailTemplates.subject.length > 0 && blueprint.crmFields.length > 0, "Notification templates, CRM fields, and workflow stages are populated."),
  ] satisfies OnboardingHealthCheck[];

  const completeCount = checks.filter((check) => check.status === "complete").length;
  const missing = checks.filter((check) => check.status !== "complete").map((check) => check.label);
  const ready = missing.length === 0;
  const score = Math.round((completeCount / checks.length) * 100);

  return {
    checks,
    completeCount,
    missing,
    ready,
    score,
  };
}

function buildBrandEngine(blueprint: BusinessOnboardingBlueprint): OnboardingSectionSummary {
  return buildSection("Brand engine", "Branding and visual identity generated from the onboarding wizard.", [
    { label: "Business name", value: blueprint.businessName },
    { label: "Logo", value: blueprint.logo || "Not set" },
    { label: "Accent", value: blueprint.colours.accent },
    { label: "Primary", value: blueprint.colours.primary },
    { label: "Secondary", value: blueprint.colours.secondary },
    { label: "Surface", value: blueprint.colours.surface },
    { label: "Text", value: blueprint.colours.text },
    { label: "Tone", value: blueprint.tone },
  ]);
}

function buildPromptStudio(blueprint: BusinessOnboardingBlueprint): OnboardingSectionSummary {
  return buildSection("Prompt studio", "The language profile and AI receptionist guidance for the new business.", [
    { label: "Greeting", value: blueprint.greeting },
    { label: "Voice personality", value: blueprint.voicePersonality },
    { label: "AI prompt", value: blueprint.aiPrompt },
    { label: "Questions to ask", value: String(blueprint.questionsToAsk.length) },
    { label: "Language", value: blueprint.language ?? "en-GB" },
  ]);
}

function buildKnowledgeBase(blueprint: BusinessOnboardingBlueprint): OnboardingSectionSummary {
  return buildSection("Knowledge base", "The rules and facts the platform should use when triaging a caller.", [
    { label: "Required information", value: String(blueprint.requiredCustomerInformation.length) },
    { label: "Emergency rules", value: String(blueprint.emergencyRules.length) },
    { label: "Escalation rules", value: String(blueprint.escalationRules.length) },
    { label: "Workflow stages", value: String(blueprint.workflowStages.length) },
    { label: "Follow-up cadence", value: blueprint.followUpCadence },
  ]);
}

function buildBookingAbstraction(blueprint: BusinessOnboardingBlueprint): OnboardingSectionSummary {
  return buildSection("Booking abstraction", "Provider-neutral booking configuration for manual, calendar, and receptionist-led scheduling.", [
    { label: "Calendar provider", value: blueprint.calendarProvider },
    { label: "Booking behaviour", value: blueprint.bookingBehaviour },
    { label: "Business hours", value: blueprint.businessHours },
    { label: "Service radius", value: blueprint.serviceRadiusMiles ? `${blueprint.serviceRadiusMiles} miles` : "Not set" },
  ]);
}

function buildOrganisationModel(blueprint: BusinessOnboardingBlueprint): OnboardingSectionSummary {
  return buildSection("Organisation model", "The business identity and operating metadata for the tenant workspace.", [
    { label: "Owner", value: blueprint.ownerName },
    { label: "Owner email", value: blueprint.ownerEmail || "Not set" },
    { label: "Business email", value: blueprint.businessEmail || "Not set" },
    { label: "Business phone", value: blueprint.businessPhone || "Not set" },
    { label: "Website", value: blueprint.businessWebsite || "Not set" },
    { label: "Address", value: blueprint.businessAddress || "Not set" },
    { label: "Timezone", value: blueprint.timezone },
  ]);
}

function buildSettingsEngine(blueprint: BusinessOnboardingBlueprint): OnboardingSectionSummary {
  return buildSection("Settings engine", "The reusable operational settings that drive notifications and dashboard wording.", [
    { label: "SMS template", value: blueprint.smsTemplates.missedCallRecovery },
    { label: "Email subject", value: blueprint.emailTemplates.subject },
    { label: "Dashboard active calls", value: blueprint.dashboardWording.activeCalls },
    { label: "CRM fields", value: String(blueprint.crmFields.length) },
    { label: "Workflow stages", value: String(blueprint.workflowStages.length) },
  ]);
}

function normalizeBlueprint(blueprint: FlowFactoryBlueprint & Partial<BusinessOnboardingBlueprint>): BusinessOnboardingBlueprint {
  return {
    ...blueprint,
    businessAddress: blueprint.businessAddress?.trim() || "",
    businessEmail: blueprint.businessEmail?.trim() || "",
    businessHours: blueprint.businessHours?.trim() || "Mon-Fri 08:00-18:00",
    businessPhone: blueprint.businessPhone?.trim() || "",
    businessWebsite: blueprint.businessWebsite?.trim() || "",
    ownerEmail: blueprint.ownerEmail?.trim() || "",
    ownerName: blueprint.ownerName?.trim() || "",
    serviceRadiusMiles: blueprint.serviceRadiusMiles?.trim() || "10",
    timezone: blueprint.timezone?.trim() || "Europe/London",
  };
}

export function getOnboardingBlueprintDefaults(): BusinessOnboardingBlueprint {
  const defaults = getFlowFactoryBlueprintDefaults();

  return normalizeBlueprint({
    ...defaults,
    businessAddress: "",
    businessEmail: "",
    businessHours: "Mon-Fri 08:00-18:00",
    businessPhone: "",
    businessWebsite: "",
    ownerEmail: "",
    ownerName: "Clinic owner",
    serviceRadiusMiles: "10",
    timezone: "Europe/London",
  });
}

export function buildOnboardingBlueprint(formData: FormData): BusinessOnboardingBlueprint {
  const defaults = getOnboardingBlueprintDefaults();

  return normalizeBlueprint({
    ...defaults,
    aiPrompt: getString(formData, "ai_prompt", defaults.aiPrompt),
    bookingBehaviour: getString(formData, "booking_behaviour", defaults.bookingBehaviour),
    businessAddress: getString(formData, "business_address", defaults.businessAddress),
    businessEmail: getString(formData, "business_email", defaults.businessEmail),
    businessHours: getString(formData, "business_hours", defaults.businessHours),
    businessName: getString(formData, "business_name", defaults.businessName),
    businessPhone: getString(formData, "business_phone", defaults.businessPhone),
    businessWebsite: getString(formData, "business_website", defaults.businessWebsite),
    calendarProvider: getString(formData, "calendar_provider", defaults.calendarProvider),
    colours: {
      accent: (getString(formData, "accent", defaults.colours.accent) as BusinessOnboardingBlueprint["colours"]["accent"]) || defaults.colours.accent,
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
    ownerEmail: getString(formData, "owner_email", defaults.ownerEmail),
    ownerName: getString(formData, "owner_name", defaults.ownerName),
    questionsToAsk: getLines(formData, "questions_to_ask", defaults.questionsToAsk),
    requiredCustomerInformation: getLines(formData, "required_customer_information", defaults.requiredCustomerInformation),
    serviceRadiusMiles: getString(formData, "service_radius_miles", defaults.serviceRadiusMiles),
    smsTemplates: {
      help: getString(formData, "sms_help", defaults.smsTemplates.help),
      missedCallRecovery: getString(formData, "sms_missed_call_recovery", defaults.smsTemplates.missedCallRecovery),
      optOut: getString(formData, "sms_opt_out", defaults.smsTemplates.optOut),
      replyYes: getString(formData, "sms_reply_yes", defaults.smsTemplates.replyYes),
      resubscribe: getString(formData, "sms_resubscribe", defaults.smsTemplates.resubscribe),
    },
    ssmlEnabled: getBoolean(formData, "ssml_enabled", defaults.ssmlEnabled ?? true),
    speechRate: getString(formData, "speech_rate", defaults.speechRate ?? "95%"),
    timezone: getString(formData, "timezone", defaults.timezone),
    tone: getString(formData, "tone", defaults.tone),
    voice: getString(formData, "voice", defaults.voice ?? "Polly.Amy-Neural"),
    voicePersonality: getString(formData, "voice_personality", defaults.voicePersonality),
    workflowStages: getLines(formData, "workflow_stages", defaults.workflowStages),
  });
}

export function generateOnboardingPackage(blueprint: BusinessOnboardingBlueprint): OnboardingGeneratedPackage {
  const generatedProfile = generateFlowFactoryPackage({
    ...blueprint,
  });
  const health = buildOnboardingHealth(blueprint);

  return {
    blueprint,
    brandEngine: buildBrandEngine(blueprint),
    bookingAbstraction: buildBookingAbstraction(blueprint),
    generatedProfile,
    knowledgeBase: buildKnowledgeBase(blueprint),
    organisationModel: buildOrganisationModel(blueprint),
    platformHealth: health,
    promptStudio: buildPromptStudio(blueprint),
    settingsEngine: buildSettingsEngine(blueprint),
  };
}

export function buildOnboardingPackageState(blueprint: BusinessOnboardingBlueprint): OnboardingActionState {
  return {
    generated: generateOnboardingPackage(blueprint),
    message: null,
    status: "idle",
  };
}
