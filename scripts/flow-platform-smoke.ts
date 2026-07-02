import { getActiveFlowPlatformProfile, getActiveFlowPlatformProfileId, getFlowPlatformProfileSummaries } from "../src/lib/flow-platform";

const expectedProfileIds = ["buildflow", "clinicflow", "estateflow", "plumbflow", "sparkflow", "heatflow"] as const;

const summaries = getFlowPlatformProfileSummaries();
const summaryIds = summaries.map((summary) => summary.id).sort();
const expectedIds = [...expectedProfileIds].sort();

if (JSON.stringify(summaryIds) !== JSON.stringify(expectedIds)) {
  throw new Error(`Flow Platform profile catalog mismatch: expected ${expectedIds.join(", ")}, received ${summaryIds.join(", ")}`);
}

const activeProfileId = getActiveFlowPlatformProfileId();
const activeProfile = getActiveFlowPlatformProfile();

if (activeProfile.id !== activeProfileId) {
  throw new Error(`Active profile mismatch: runtime resolved ${activeProfileId} but profile object reports ${activeProfile.id}`);
}

for (const profile of summaries) {
  if (profile.intentCount <= 0) {
    throw new Error(`Profile ${profile.id} has no registered intents`);
  }

  if (profile.entityCount <= 0) {
    throw new Error(`Profile ${profile.id} has no registered entities`);
  }

  if (profile.workflowCount <= 0) {
    throw new Error(`Profile ${profile.id} has no registered workflows`);
  }
}

console.log("Flow Platform smoke check passed");
console.log(`Active profile: ${activeProfile.id}`);
console.log(
  summaries
    .map((profile) => `${profile.id}:${profile.intentCount} intents/${profile.entityCount} entities/${profile.workflowCount} workflows`)
    .join(" | "),
);
