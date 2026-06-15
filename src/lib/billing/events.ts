import type { BillingActor, BillingEvent } from "@/lib/billing/types";

export function createBillingEvent(type: BillingEvent["type"], tenantId: string, actor: BillingActor): BillingEvent {
  return {
    actor,
    auditSafe: true,
    createdAt: new Date().toISOString(),
    id: `billing_${type}_${Date.now()}`,
    tenantId,
    type,
  };
}

export function acceptBillingWebhookDemo(eventType: string) {
  return {
    accepted: true,
    eventType,
    mode: "demo" as const,
    note: "No payment provider was contacted.",
  };
}

