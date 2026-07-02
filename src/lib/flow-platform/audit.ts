import type { FlowAuditCategory, FlowAuditRecord } from "./types";
import { createFlowEvent } from "./events";

export type FlowAuditEngineOptions = {
  logger?: Pick<Console, "error" | "info" | "warn">;
  profileId: string;
};

export type FlowAuditInput = {
  actor?: string;
  category: FlowAuditCategory;
  clinicId?: string | null;
  detail: string;
  entityId?: string;
  entityType?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  outcome?: FlowAuditRecord["outcome"];
  profileId?: string;
};

export type FlowAuditSummary = {
  byCategory: Record<FlowAuditCategory, number>;
  byOutcome: Record<FlowAuditRecord["outcome"], number>;
  count: number;
};

export function createFlowAuditRecord(input: FlowAuditInput): FlowAuditRecord {
  return {
    actor: input.actor,
    category: input.category,
    clinicId: input.clinicId ?? null,
    createdAt: new Date().toISOString(),
    detail: input.detail,
    entityId: input.entityId,
    entityType: input.entityType,
    eventType: input.eventType,
    id: `flow_audit_${input.eventType}_${Date.now()}`,
    metadata: input.metadata,
    outcome: input.outcome ?? "success",
    profileId: input.profileId ?? "clinicflow",
  };
}

export function createFlowAuditEngine(options: FlowAuditEngineOptions) {
  const records: FlowAuditRecord[] = [];

  return {
    async record(input: FlowAuditInput) {
      const record = createFlowAuditRecord({ ...input, profileId: input.profileId ?? options.profileId });
      records.push(record);

      options.logger?.info("[Flow Audit] record captured", {
        category: record.category,
        clinicId: record.clinicId,
        eventType: record.eventType,
        outcome: record.outcome,
        profileId: record.profileId,
      });

      return record;
    },
    records() {
      return [...records];
    },
    summary(): FlowAuditSummary {
      return records.reduce<FlowAuditSummary>(
        (accumulator, record) => {
          accumulator.count += 1;
          accumulator.byCategory[record.category] += 1;
          accumulator.byOutcome[record.outcome] += 1;
          return accumulator;
        },
        {
          byCategory: {
            ai: 0,
            booking: 0,
            customer: 0,
            notification: 0,
            timeline: 0,
            transfer: 0,
            workflow: 0,
            escalation: 0,
          },
          byOutcome: {
            failed: 0,
            info: 0,
            skipped: 0,
            success: 0,
          },
          count: 0,
        },
      );
    },
    toEvent(record: FlowAuditRecord) {
      return createFlowEvent(
        "audit.recorded",
        {
          actor: record.actor,
          category: record.category,
          detail: record.detail,
          entityId: record.entityId,
          entityType: record.entityType,
          eventType: record.eventType,
          outcome: record.outcome,
          profileId: record.profileId,
        },
        record.profileId,
        record.clinicId,
        { auditId: record.id },
      );
    },
  };
}

export function summarizeFlowAudits(records: readonly FlowAuditRecord[]): FlowAuditSummary {
  return records.reduce<FlowAuditSummary>(
    (accumulator, record) => {
      accumulator.count += 1;
      accumulator.byCategory[record.category] += 1;
      accumulator.byOutcome[record.outcome] += 1;
      return accumulator;
    },
    {
      byCategory: {
        ai: 0,
        booking: 0,
        customer: 0,
        notification: 0,
        timeline: 0,
        transfer: 0,
        workflow: 0,
        escalation: 0,
      },
      byOutcome: {
        failed: 0,
        info: 0,
        skipped: 0,
        success: 0,
      },
      count: 0,
    },
  );
}

