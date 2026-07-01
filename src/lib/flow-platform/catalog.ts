import { flowPlatformProfiles, type FlowPlatformProfileId } from "./registry";

export type FlowPlatformProfileSummary = {
  description: string;
  dashboardIcons: string[];
  entityCount: number;
  id: FlowPlatformProfileId;
  industry: string;
  intentCount: number;
  name: string;
  workflowCount: number;
  voice: string;
};

export function getFlowPlatformProfileSummaries(): FlowPlatformProfileSummary[] {
  return (Object.entries(flowPlatformProfiles) as Array<[FlowPlatformProfileId, (typeof flowPlatformProfiles)[FlowPlatformProfileId]]>).map(
    ([id, profile]) => ({
      description: profile.industry.description,
      dashboardIcons: profile.dashboard.icons,
      entityCount: profile.conversation.voice.entityDefinitions.length + profile.conversation.leads.entityDefinitions.length,
      id,
      industry: profile.industry.name,
      intentCount: profile.conversation.voice.intentDefinitions.length + profile.conversation.leads.intentDefinitions.length,
      name: profile.clinic.name,
      workflowCount: profile.workflows.length,
      voice: profile.conversation.voice.voice,
    }),
  );
}

export function getFlowPlatformProfileSummary(id: FlowPlatformProfileId) {
  return getFlowPlatformProfileSummaries().find((profile) => profile.id === id) ?? null;
}

