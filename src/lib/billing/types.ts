export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "cancelled";
export type BillingCycle = "monthly" | "annual";
export type BillingActor = "clinic" | "agency" | "enterprise";

export type SubscriptionState = {
  tenantId: string;
  planKey: "starter" | "growth" | "enterprise";
  status: SubscriptionStatus;
  cycle: BillingCycle;
  seats: number;
  trialEndsAt: string | null;
  renewsAt: string | null;
};

export type UsageMeter = {
  key: string;
  label: string;
  used: number;
  limit: number;
};

export type BillingEvent = {
  id: string;
  tenantId: string;
  type: "trial_started" | "subscription_changed" | "usage_recorded" | "invoice_created" | "cancellation_requested";
  actor: BillingActor;
  auditSafe: boolean;
  createdAt: string;
};

