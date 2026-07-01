import { clinicFlowPlatformProfile } from "./profiles/clinicflow";
import { plumbFlowPlatformProfile } from "./profiles/plumbflow";

export const flowPlatformProfiles = {
  clinicflow: clinicFlowPlatformProfile,
  plumbflow: plumbFlowPlatformProfile,
} as const;

export type FlowPlatformProfileId = keyof typeof flowPlatformProfiles;

export function getFlowPlatformProfile(id: FlowPlatformProfileId = "clinicflow") {
  return flowPlatformProfiles[id];
}
