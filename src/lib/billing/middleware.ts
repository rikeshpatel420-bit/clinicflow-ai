import type { SubscriptionState } from "@/lib/billing/types";
import { accountQuotas } from "@/lib/billing/quotas";

export function hasEntitlement(subscription: SubscriptionState, feature: "ai_receptionist" | "enterprise_governance" | "white_label" | "revenue_ops") {
  const entitlements = {
    starter: ["revenue_ops"],
    growth: ["ai_receptionist", "revenue_ops"],
    enterprise: ["ai_receptionist", "enterprise_governance", "white_label", "revenue_ops"],
  };

  return entitlements[subscription.planKey].includes(feature);
}

export function getAccountLimits(subscription: SubscriptionState) {
  return accountQuotas[subscription.planKey];
}

