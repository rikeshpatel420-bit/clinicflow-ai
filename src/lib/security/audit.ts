export type AuditAction =
  | "auth.login_attempt"
  | "tenant.access_checked"
  | "crm.record_viewed"
  | "billing.plan_viewed"
  | "webhook.event_received"
  | "security.policy_checked";

export type AuditRecord = {
  id: string;
  action: AuditAction;
  actorId: string | null;
  clinicId: string | null;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export function createAuditRecord(input: Omit<AuditRecord, "id" | "createdAt">): AuditRecord {
  return {
    ...input,
    createdAt: new Date().toISOString(),
    id: `audit_${input.action}_${Date.now()}`,
  };
}

