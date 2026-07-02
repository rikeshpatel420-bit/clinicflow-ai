import { getFlowPlatformProfileSummaries, getFlowPlatformProfileValidationSummaries } from "../src/lib/flow-platform";

async function main() {
  const expectedProductIds = ["plumbflow", "sparkflow", "heatflow", "estateflow", "vetflow"] as const;
  const summaries = getFlowPlatformProfileSummaries();
  const validations = getFlowPlatformProfileValidationSummaries();

  const summaryMap = new Map(summaries.map((summary) => [summary.id, summary]));
  const validationMap = new Map(validations.map((summary) => [summary.id, summary]));

  for (const profileId of expectedProductIds) {
    const summary = summaryMap.get(profileId);
    const validation = validationMap.get(profileId);

    if (!summary) {
      throw new Error(`Flow product smoke test missing profile summary for ${profileId}`);
    }

    if (!validation) {
      throw new Error(`Flow product smoke test missing validation summary for ${profileId}`);
    }

    if (!validation.platformReady) {
      throw new Error(`Flow product ${profileId} is not platform-ready: ${validation.missing.join(", ")}`);
    }

    if (summary.workflowCount <= 0 || summary.templateCount <= 0 || summary.notificationCount <= 0 || summary.intentCount <= 0 || summary.entityCount <= 0) {
      throw new Error(`Flow product ${profileId} is missing core profile data`);
    }
  }

  console.log("Flow product smoke check passed");
  console.log(
    expectedProductIds
      .map((profileId) => {
        const summary = summaryMap.get(profileId)!;
        const validation = validationMap.get(profileId)!;
        return `${profileId}:${summary.workflowCount} workflows/${summary.templateCount} templates/${validation.status}`;
      })
      .join(" | "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
