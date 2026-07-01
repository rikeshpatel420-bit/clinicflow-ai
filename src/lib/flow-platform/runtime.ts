import type { FlowPlatformProfileId } from "./registry";
import { getFlowPlatformProfile, flowPlatformProfiles } from "./registry";

export const defaultFlowPlatformProfileId: FlowPlatformProfileId = "clinicflow";

export function getActiveFlowPlatformProfileId(): FlowPlatformProfileId {
  const rawProfileId = process.env.FLOW_PLATFORM_PROFILE_ID?.trim().toLowerCase();

  if (rawProfileId && rawProfileId in flowPlatformProfiles) {
    return rawProfileId as FlowPlatformProfileId;
  }

  return defaultFlowPlatformProfileId;
}

export function getActiveFlowPlatformProfile() {
  return getFlowPlatformProfile(getActiveFlowPlatformProfileId());
}
