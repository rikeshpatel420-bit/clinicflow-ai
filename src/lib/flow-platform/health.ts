import packageJson from "../../../package.json";
import { buildFlowEventTopicSummary } from "./events";
import { buildFlowTemplateRegistry, summarizeFlowTemplates } from "./templates";
import { buildNotificationRules, summarizeNotificationRules } from "./notifications";
import { getFlowPlatformProfileSummaries, type FlowPlatformProfileSummary } from "./catalog";
import { getActiveFlowPlatformProfile } from "./runtime";

export type FlowPlatformHealthStatus = "operational" | "attention" | "degraded";

export type FlowPlatformHealthSnapshot = {
  activeProfile: {
    id: string;
    name: string;
    industry: string;
  };
  availableProfiles: number;
  eventTopics: number;
  health: readonly {
    service: string;
    status: FlowPlatformHealthStatus;
    detail: string;
  }[];
  notificationSummary: ReturnType<typeof summarizeNotificationRules>;
  profileSummaries: FlowPlatformProfileSummary[];
  triggerCount: number;
  smokeStatus: "passing" | "attention";
  templateSummary: ReturnType<typeof summarizeFlowTemplates>;
  version: string;
  workflowCount: number;
};

export function getFlowPlatformHealthSnapshot(): FlowPlatformHealthSnapshot {
  const activeProfile = getActiveFlowPlatformProfile();
  const profileSummaries = getFlowPlatformProfileSummaries();
  const templateRegistry = buildFlowTemplateRegistry(activeProfile);
  const notificationRules = buildNotificationRules(activeProfile);
  const templateSummary = summarizeFlowTemplates(templateRegistry);
  const notificationSummary = summarizeNotificationRules(notificationRules);
  const eventTopicSummary = buildFlowEventTopicSummary();
  const workflowCount = profileSummaries.reduce((total, profile) => total + profile.workflowCount, 0);
  const intentCount = profileSummaries.reduce((total, profile) => total + profile.intentCount, 0);
  const entityCount = profileSummaries.reduce((total, profile) => total + profile.entityCount, 0);
  const triggerCount = profileSummaries.reduce((total, profile) => total + profile.triggerCount, 0);

  const health = [
    {
      detail: `${profileSummaries.length} profiles registered in the Flow Platform catalog.`,
      service: "Profile registry",
      status: profileSummaries.length > 0 ? "operational" : "degraded",
    },
    {
      detail: `${templateSummary.templateCount} templates available for ${activeProfile.clinic.name}.`,
      service: "Template registry",
      status: templateSummary.templateCount > 0 ? "operational" : "attention",
    },
    {
      detail: `${notificationSummary.count} notification rules registered for the active profile.`,
      service: "Notification engine",
      status: notificationSummary.count > 0 ? "operational" : "attention",
    },
    {
      detail: `${eventTopicSummary.registeredTopics} event topics available for the platform bus.`,
      service: "Event bus",
      status: eventTopicSummary.registeredTopics > 0 ? "operational" : "attention",
    },
    {
      detail: `${workflowCount} workflows, ${triggerCount} triggers, ${intentCount} intents, and ${entityCount} entities are registered across the platform.`,
      service: "Workflow engine",
      status: workflowCount > 0 && triggerCount > 0 && intentCount > 0 && entityCount > 0 ? "operational" : "attention",
    },
  ] satisfies FlowPlatformHealthSnapshot["health"];

  const smokeStatus: FlowPlatformHealthSnapshot["smokeStatus"] =
    profileSummaries.length > 0 && templateSummary.templateCount > 0 && notificationSummary.count > 0 && eventTopicSummary.registeredTopics > 0 && triggerCount > 0 ? "passing" : "attention";

  return {
    activeProfile: {
      id: activeProfile.id,
      industry: activeProfile.industry.name,
      name: activeProfile.clinic.name,
    },
    availableProfiles: profileSummaries.length,
    eventTopics: eventTopicSummary.registeredTopics,
    health,
    notificationSummary,
    profileSummaries,
    triggerCount,
    smokeStatus,
    templateSummary,
    version: packageJson.version,
    workflowCount,
  };
}
