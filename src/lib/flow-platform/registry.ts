import { clinicFlowPlatformProfile } from "./profiles/clinicflow";

export const flowPlatformProfiles = {
  clinicflow: clinicFlowPlatformProfile,
} as const;

export type FlowPlatformProfileId = keyof typeof flowPlatformProfiles;

export function getFlowPlatformProfile(id: FlowPlatformProfileId = "clinicflow") {
  return flowPlatformProfiles[id];
}

