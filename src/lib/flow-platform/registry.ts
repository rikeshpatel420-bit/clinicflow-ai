import { clinicFlowPlatformProfile } from "./profiles/clinicflow";
import { heatFlowPlatformProfile } from "./profiles/heatflow";
import { plumbFlowPlatformProfile } from "./profiles/plumbflow";
import { sparkFlowPlatformProfile } from "./profiles/sparkflow";

export const flowPlatformProfiles = {
  clinicflow: clinicFlowPlatformProfile,
  heatflow: heatFlowPlatformProfile,
  plumbflow: plumbFlowPlatformProfile,
  sparkflow: sparkFlowPlatformProfile,
} as const;

export type FlowPlatformProfileId = keyof typeof flowPlatformProfiles;

export function getFlowPlatformProfile(id: FlowPlatformProfileId = "clinicflow") {
  return flowPlatformProfiles[id];
}
