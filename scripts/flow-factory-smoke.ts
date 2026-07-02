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

console.log("Flow Factory smoke check passed");
console.log(`Generated profile: ${generated.profileId}`);
console.log(`Artifacts: ${generated.files.length} | Routes: ${generated.routes.length} | Stages: ${generated.workflowStages.length}`);
