import { buildFlowTemplateRegistry } from "./templates";
import { flowPlatformProfiles, type FlowPlatformProfileId } from "./registry";
import type { FlowPlatformProfile } from "./types";

export type FlowPlatformProfileValidationCheckId =
  | "branding"
  | "voice"
  | "templates"
  | "workflows"
  | "prompts"
  | "navigation"
  | "notificationRules"
  | "emergencyRules"
  | "bookingRules"
  | "aiConfiguration";

export type FlowPlatformProfileValidationCheck = {
  detail: string;
  id: FlowPlatformProfileValidationCheckId;
  label: string;
  ok: boolean;
};

export type FlowPlatformProfileValidationSummary = {
  automationProfile: string;
  checks: readonly FlowPlatformProfileValidationCheck[];
  id: FlowPlatformProfileId;
  industry: string;
  inheritance: string;
  missing: string[];
  name: string;
  notificationCount: number;
  platformReady: boolean;
  status: "ready" | "attention";
  templateCount: number;
  voice: string;
  workflowCount: number;
};

type FlowPlatformProfileLike = Pick<
  FlowPlatformProfile<string, string, string, string, string>,
  "clinic" | "conversation" | "dashboard" | "id" | "knowledgeBase" | "notifications" | "workflows" | "industry"
>;

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildCheck(id: FlowPlatformProfileValidationCheckId, label: string, ok: boolean, detail: string): FlowPlatformProfileValidationCheck {
  return { detail, id, label, ok };
}

export function validateFlowPlatformProfile(profile: FlowPlatformProfileLike): FlowPlatformProfileValidationSummary {
  const templateRegistry = buildFlowTemplateRegistry(profile);
  const registryIds = new Set(Object.keys(flowPlatformProfiles));

  const checks = [
    buildCheck(
      "branding",
      "Branding",
      [
        hasText(profile.clinic.branding.logoText),
        hasText(profile.clinic.branding.primary),
        hasText(profile.clinic.branding.secondary),
        hasText(profile.clinic.branding.surface),
        hasText(profile.clinic.branding.text),
      ].every(Boolean),
      "Logo, colours, and clinic branding are configured.",
    ),
    buildCheck(
      "voice",
      "Voice",
      [
        hasText(profile.conversation.voice.voice),
        hasText(profile.conversation.voice.greeting),
        hasText(profile.conversation.voice.closing),
        profile.conversation.voice.intentDefinitions.length > 0,
        profile.conversation.voice.entityDefinitions.length > 0,
        profile.conversation.voice.actionDefinitions.length > 0,
      ].every(Boolean),
      "Greeting, closing, voice, intents, entities, and actions are configured.",
    ),
    buildCheck(
      "templates",
      "Templates",
      templateRegistry.templates.length > 0 &&
        hasText(profile.conversation.voice.templates.email.subject) &&
        hasText(profile.conversation.voice.templates.email.body) &&
        hasText(profile.conversation.voice.templates.sms.missedCallRecovery),
      `${templateRegistry.templates.length} reusable templates are available.`,
    ),
    buildCheck("workflows", "Workflows", profile.workflows.length > 0, `${profile.workflows.length} workflow definitions are registered.`),
    buildCheck("prompts", "Prompts", profile.knowledgeBase.prompts.length > 0 && profile.knowledgeBase.safeResponses.length > 0, `${profile.knowledgeBase.prompts.length} prompt entries and ${profile.knowledgeBase.safeResponses.length} safe responses are configured.`),
    buildCheck(
      "navigation",
      "Navigation",
      registryIds.has(profile.id) && profile.dashboard.icons.length > 0 && Object.keys(profile.dashboard.labels).length > 0,
      "Profile is registered in the platform catalog and includes dashboard navigation metadata.",
    ),
    buildCheck("notificationRules", "Notification rules", profile.notifications.length > 0, `${profile.notifications.length} notification rules are registered.`),
    buildCheck(
      "emergencyRules",
      "Emergency rules",
      hasText(profile.conversation.voice.emergencyPrompt) &&
        profile.conversation.voice.escalationRules.length > 0 &&
        profile.conversation.leads.escalationRules.length > 0,
      "Emergency prompt and escalation guidance are configured for voice and lead intake.",
    ),
    buildCheck(
      "bookingRules",
      "Booking rules",
      profile.clinic.appointmentRules.length > 0 && profile.conversation.voice.recoveryRules.length > 0,
      `${profile.clinic.appointmentRules.length} appointment rules and ${profile.conversation.voice.recoveryRules.length} recovery rules are configured.`,
    ),
    buildCheck(
      "aiConfiguration",
      "AI configuration",
      hasText(profile.conversation.voice.summaryTemplates.patientSummary) &&
        hasText(profile.conversation.voice.summaryTemplates.receptionNotes) &&
        hasText(profile.conversation.leads.summaryTemplates.patientSummary) &&
        hasText(profile.knowledgeBase.businessRules[0] ?? ""),
      "AI prompts, summary templates, and safety rules are configured for the profile.",
    ),
  ] satisfies FlowPlatformProfileValidationCheck[];

  const missing = checks.filter((check) => !check.ok).map((check) => check.label);

  return {
    automationProfile: profile.workflows.length > 0 ? "Workflow-driven automation" : "No automation defined",
    checks,
    id: profile.id as FlowPlatformProfileId,
    industry: profile.industry.name,
    inheritance: "Shared Flow Platform core",
    missing,
    name: profile.clinic.name,
    notificationCount: profile.notifications.length,
    platformReady: missing.length === 0,
    status: missing.length === 0 ? "ready" : "attention",
    templateCount: templateRegistry.templates.length,
    voice: profile.conversation.voice.voice,
    workflowCount: profile.workflows.length,
  };
}

export function getFlowPlatformProfileValidationSummaries(): FlowPlatformProfileValidationSummary[] {
  return (Object.values(flowPlatformProfiles) as FlowPlatformProfileLike[]).map((profile) => validateFlowPlatformProfile(profile));
}

