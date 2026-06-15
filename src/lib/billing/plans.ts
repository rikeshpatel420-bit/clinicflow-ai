export type BillingPlanKey = "starter" | "growth" | "enterprise";

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  clinicsIncluded: number;
  features: string[];
  stripePriceEnvKey: string;
};

export const billingPlans: BillingPlan[] = [
  {
    key: "starter",
    name: "Starter",
    clinicsIncluded: 1,
    features: ["Dashboard", "Patients", "Missed-call recovery demo"],
    stripePriceEnvKey: "STRIPE_PRICE_STARTER",
  },
  {
    key: "growth",
    name: "Growth",
    clinicsIncluded: 3,
    features: ["Revenue operations", "AI receptionist demo", "Performance center"],
    stripePriceEnvKey: "STRIPE_PRICE_GROWTH",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    clinicsIncluded: 999,
    features: ["Multi-location governance", "Enterprise reporting", "White-label readiness"],
    stripePriceEnvKey: "STRIPE_PRICE_ENTERPRISE",
  },
];

export function isBillingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

