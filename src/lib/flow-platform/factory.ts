import type { FlowPlatformProfile } from "./types";

export function defineFlowPlatformProfile<
  TVoiceIntent extends string,
  TVoiceEntity extends string,
  TTreatmentIntent extends string,
  TLeadIntent extends string,
  TLeadEntity extends string = never,
>(profile: FlowPlatformProfile<TVoiceIntent, TVoiceEntity, TTreatmentIntent, TLeadIntent, TLeadEntity>) {
  return profile;
}
