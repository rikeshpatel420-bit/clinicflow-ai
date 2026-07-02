import {
  buildCommercialSaasSnapshot,
  buildSaasCapabilityCatalog,
  buildSaasBillingTiers,
  getSaasPlatformModuleCatalog,
  getSaasProviderCatalog,
} from "../src/lib/saas";
import { getFlowPlatformProfileSummaries } from "../src/lib/flow-platform";

async function main() {
  const snapshot = await buildCommercialSaasSnapshot({
    baseUrl: "http://localhost:3000",
    user: null,
  });

  const expectedProfiles = ["buildflow", "clinicflow", "estateflow", "heatflow", "plumbflow", "sparkflow", "vetflow"];
  const marketplaceIds = snapshot.marketplace.map((product) => product.id).sort();

  for (const profileId of expectedProfiles) {
    if (!marketplaceIds.includes(profileId)) {
      throw new Error(`Commercial smoke test missing marketplace product ${profileId}`);
    }
  }

  if (snapshot.billing.plans.length !== buildSaasBillingTiers().length) {
    throw new Error("Commercial smoke test billing catalog mismatch");
  }

  if (snapshot.onboarding.healthScore <= 0) {
    throw new Error("Commercial smoke test onboarding health score did not initialise");
  }

  if (snapshot.readiness.steps.length < 5) {
    throw new Error("Commercial smoke test readiness checklist is incomplete");
  }

  if (snapshot.integrations.providerCount !== getSaasProviderCatalog().length) {
    throw new Error("Commercial smoke test provider catalog mismatch");
  }

  if (snapshot.workspaceSummary.permissionCount <= 0) {
    throw new Error("Commercial smoke test workspace permissions were not resolved");
  }

  if (snapshot.activeProfile.id !== "clinicflow") {
    throw new Error(`Expected ClinicFlow to remain the default commercial profile, received ${snapshot.activeProfile.id}`);
  }

  if (snapshot.marketplace.filter((product) => product.active).length !== 1) {
    throw new Error("Commercial smoke test expected exactly one active marketplace product");
  }

  const moduleCount = getSaasPlatformModuleCatalog().length;
  const capabilityCount = buildSaasCapabilityCatalog().length;
  const profileCount = getFlowPlatformProfileSummaries().length;

  if (moduleCount < 5 || capabilityCount < 5 || profileCount < 5) {
    throw new Error("Commercial smoke test expected the platform catalog to contain multiple reusable entries");
  }

  console.log("Commercial SaaS smoke check passed");
  console.log(
    `Profiles ${profileCount} | Modules ${moduleCount} | Capabilities ${capabilityCount} | Billing tiers ${snapshot.billing.plans.length} | Marketplace ${snapshot.marketplace.length}`,
  );
  console.log(
    `Readiness ${snapshot.readiness.readinessScore}% | Onboarding ${snapshot.onboarding.healthScore}% | Integrations ${snapshot.integrations.counts.connected}/${snapshot.integrations.providerCount}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
