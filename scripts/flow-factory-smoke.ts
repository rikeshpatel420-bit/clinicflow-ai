import { generateFlowFactoryPackage, getFlowFactoryBlueprintDefaults } from "../src/lib/flow-factory";

const generated = generateFlowFactoryPackage(getFlowFactoryBlueprintDefaults());

if (!generated.profileId) {
  throw new Error("Flow Factory did not generate a profile ID");
}

if (generated.files.length < 3) {
  throw new Error("Flow Factory did not generate the expected artifact bundle");
}

if (generated.routes.length < 3) {
  throw new Error("Flow Factory did not generate enough route suggestions");
}

if (generated.workflowStages.length === 0) {
  throw new Error("Flow Factory did not generate workflow stages");
}

if (generated.platformDefaults.navigation.length === 0) {
  throw new Error("Flow Factory did not generate default navigation");
}

if (generated.platformDefaults.notificationTemplates.length === 0) {
  throw new Error("Flow Factory did not generate notification templates");
}

if (generated.platformDefaults.workflowBlueprints.length === 0) {
  throw new Error("Flow Factory did not generate workflow blueprints");
}

console.log("Flow Factory smoke check passed");
console.log(`Generated profile: ${generated.profileId}`);
console.log(
  `Artifacts: ${generated.files.length} | Routes: ${generated.routes.length} | Stages: ${generated.workflowStages.length} | Templates: ${generated.platformDefaults.notificationTemplates.length}`,
);
