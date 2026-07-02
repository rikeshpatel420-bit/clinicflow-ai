import { billingDemo } from "@/lib/billing/data";
import { aiDemo } from "@/lib/ai/data";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import { getDemoDashboardData } from "@/lib/dashboard/data";
import { getDemoReceptionConsoleData } from "@/lib/reception/data";
import { generateOnboardingPackage, getOnboardingBlueprintDefaults } from "@/lib/onboarding";
import { workflowDemo } from "@/lib/workflows/data";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const dashboard = getDemoDashboardData();
const reception = getDemoReceptionConsoleData();
const onboarding = generateOnboardingPackage(getOnboardingBlueprintDefaults());

assert(dashboard.source === "demo", "Demo dashboard should remain available");
assert(dashboard.metrics.length >= 4, "Dashboard should expose summary metrics");
assert(dashboard.calls.length > 0, "Demo dashboard should include sample calls");
assert(reception.metrics.length >= 5, "Reception console should expose rich metrics");
assert(reception.summary.smsRecommendation.includes("Reply YES"), "Reception summary should keep the recovery wording");
assert(billingDemo.plans.length >= 3, "Billing catalogue should include core plans");
assert(billingDemo.invoices.length >= 2, "Billing preview should expose invoices");
assert(enterpriseSettingsDemo.team.length >= 3, "Settings demo should expose team members");
assert(enterpriseSettingsDemo.permissionMatrix.length >= 3, "Settings demo should expose roles");
assert(aiDemo.leads.length >= 3, "AI demo should expose scenarios");
assert(aiDemo.knowledgeBase.length >= 4, "AI demo should expose knowledge placeholders");
assert(workflowDemo.workflows.length >= 2, "Workflow demo should expose multiple workflows");
assert(onboarding.platformHealth.checks.length >= 6, "Onboarding package should include health checks");

console.log("Customer experience smoke check passed");
console.log(
  [
    `Calls ${dashboard.calls.length}`,
    `Metrics ${dashboard.metrics.length}`,
    `Billing plans ${billingDemo.plans.length}`,
    `Roles ${enterpriseSettingsDemo.permissionMatrix.length}`,
    `AI leads ${aiDemo.leads.length}`,
    `Workflows ${workflowDemo.workflows.length}`,
    `Onboarding checks ${onboarding.platformHealth.checks.length}`,
  ].join(" | "),
);
