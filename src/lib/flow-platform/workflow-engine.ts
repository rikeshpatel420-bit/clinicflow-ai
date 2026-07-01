import type { FlowPlatformProfile, FlowWorkflowDefinition } from "./types";

export type WorkflowPlan = {
  channel: FlowWorkflowDefinition["channel"];
  description: string;
  handler: string;
  key: string;
  label: string;
  trigger: string;
};

export function listWorkflowDefinitions(profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">) {
  return [...profile.workflows];
}

export function resolveWorkflowDefinition(
  profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">,
  key: string,
): FlowWorkflowDefinition | null {
  return profile.workflows.find((workflow) => workflow.key === key) ?? null;
}

export function createWorkflowPlan(
  profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">,
  key: string,
): WorkflowPlan | null {
  const workflow = resolveWorkflowDefinition(profile, key);
  if (!workflow) {
    return null;
  }

  return {
    channel: workflow.channel,
    description: workflow.description,
    handler: workflow.handler,
    key: workflow.key,
    label: workflow.label,
    trigger: workflow.trigger,
  };
}

export function workflowHandlerNames(profile: Pick<FlowPlatformProfile<string, string, string, string>, "workflows">) {
  return profile.workflows.map((workflow) => workflow.handler);
}

