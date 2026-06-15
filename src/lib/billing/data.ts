import { billingPlans } from "@/lib/billing/plans";
import { createBillingEvent } from "@/lib/billing/events";
import { calculateSeatPrice, formatBillingCurrency } from "@/lib/billing/pricing";
import type { SubscriptionState, UsageMeter } from "@/lib/billing/types";

export const demoSubscription: SubscriptionState = {
  cycle: "monthly",
  planKey: "growth",
  renewsAt: "2026-07-01",
  seats: 8,
  status: "trialing",
  tenantId: "demo-org-harbour",
  trialEndsAt: "2026-06-29",
};

export const billingDemo = {
  subscription: demoSubscription,
  plans: billingPlans.map((plan) => ({
    ...plan,
    displayPrice: formatBillingCurrency(calculateSeatPrice(plan.key === "starter" ? 9900 : plan.key === "growth" ? 24900 : 79900, demoSubscription.seats)),
  })),
  usage: [
    { key: "clinics", label: "Clinics", used: 3, limit: 3 },
    { key: "seats", label: "Seats", used: 8, limit: 15 },
    { key: "conversations", label: "Conversations", used: 1840, limit: 5000 },
    { key: "automations", label: "Automations", used: 18, limit: 30 },
  ] satisfies UsageMeter[],
  entitlements: [
    { feature: "Revenue operations", starter: true, growth: true, enterprise: true },
    { feature: "AI receptionist demo", starter: false, growth: true, enterprise: true },
    { feature: "Enterprise governance", starter: false, growth: false, enterprise: true },
    { feature: "White-label support", starter: false, growth: false, enterprise: true },
  ],
  invoices: [
    { id: "inv-1", label: "Demo invoice preview", amount: "GBP 452", status: "draft", due: "Not issued" },
    { id: "inv-2", label: "Trial credit", amount: "GBP 0", status: "applied", due: "Trial period" },
  ],
  events: [
    createBillingEvent("trial_started", "demo-org-harbour", "clinic"),
    createBillingEvent("usage_recorded", "demo-org-harbour", "clinic"),
    createBillingEvent("subscription_changed", "demo-org-harbour", "agency"),
  ],
};

