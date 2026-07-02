import { buildFlowPlatformProfile } from "./profiles/buildflow";
import { clinicFlowPlatformProfile } from "./profiles/clinicflow";
import { estateFlowPlatformProfile } from "./profiles/estateflow";
import { heatFlowPlatformProfile } from "./profiles/heatflow";
import { plumbFlowPlatformProfile } from "./profiles/plumbflow";
import { sparkFlowPlatformProfile } from "./profiles/sparkflow";
import { vetFlowPlatformProfile } from "./profiles/vetflow";

export const flowPlatformProfiles = {
  buildflow: buildFlowPlatformProfile,
  clinicflow: clinicFlowPlatformProfile,
  estateflow: estateFlowPlatformProfile,
  heatflow: heatFlowPlatformProfile,
  plumbflow: plumbFlowPlatformProfile,
  sparkflow: sparkFlowPlatformProfile,
  vetflow: vetFlowPlatformProfile,
} as const;

export type FlowPlatformProfileId = keyof typeof flowPlatformProfiles;

export function getFlowPlatformProfile(id: FlowPlatformProfileId = "clinicflow") {
  return flowPlatformProfiles[id];
}
