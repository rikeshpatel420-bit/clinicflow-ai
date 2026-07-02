import type { FlowAuditRecord, FlowNotificationDispatchRecord, FlowTimelineItem } from "./types";

export type FlowTimelineSource =
  | { kind: "audit"; record: FlowAuditRecord }
  | { kind: "notification"; record: FlowNotificationDispatchRecord }
  | { kind: "event"; record: { createdAt: string; detail: string; id: string; profileId: string; clinicId: string | null; topic: string; metadata?: Record<string, unknown> } }
  | { kind: "note"; record: { createdAt: string; detail: string; id: string; profileId: string; clinicId: string | null; title: string; entityId?: string; metadata?: Record<string, unknown> } };

function timelineItemId(prefix: string, id: string) {
  return `flow_tl_${prefix}_${id}`;
}

export function createFlowTimelineItemFromSource(source: FlowTimelineSource): FlowTimelineItem {
  switch (source.kind) {
    case "audit":
      return {
        clinicId: source.record.clinicId,
        createdAt: source.record.createdAt,
        detail: source.record.detail,
        id: timelineItemId("audit", source.record.id),
        metadata: { ...source.record.metadata, auditId: source.record.id, category: source.record.category, eventType: source.record.eventType },
        profileId: source.record.profileId,
        status: source.record.outcome,
        title: `${source.record.category} audit`,
        type: "audit",
      };
    case "notification":
      return {
        clinicId: source.record.clinicId,
        createdAt: source.record.createdAt,
        detail: `${source.record.templateTitle} via ${source.record.channel}.`,
        direction: source.record.channel === "internal" ? "internal" : "outbound",
        id: timelineItemId("notification", source.record.id),
        metadata: { ...source.record.metadata, templateId: source.record.templateId, outcome: source.record.outcome },
        profileId: source.record.profileId,
        status: source.record.outcome,
        title: "Notification",
        type: "notification",
      };
    case "event":
      return {
        clinicId: source.record.clinicId,
        createdAt: source.record.createdAt,
        detail: source.record.detail,
        id: timelineItemId("event", source.record.id),
        metadata: source.record.metadata,
        profileId: source.record.profileId,
        status: "recorded",
        title: source.record.topic,
        type: "workflow",
      };
    case "note":
      return {
        clinicId: source.record.clinicId,
        createdAt: source.record.createdAt,
        detail: source.record.detail,
        entityId: source.record.entityId,
        id: timelineItemId("note", source.record.id),
        metadata: source.record.metadata,
        profileId: source.record.profileId,
        status: "recorded",
        title: source.record.title,
        type: "note",
      };
  }
}

export function buildFlowTimeline(sources: readonly FlowTimelineSource[]) {
  return sources
    .map((source) => createFlowTimelineItemFromSource(source))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function mergeFlowTimeline(...collections: readonly (readonly FlowTimelineItem[])[]) {
  return collections
    .flat()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function summarizeFlowTimeline(items: readonly FlowTimelineItem[]) {
  return items.reduce(
    (accumulator, item) => {
      accumulator.count += 1;
      accumulator.byType[item.type] = (accumulator.byType[item.type] ?? 0) + 1;
      return accumulator;
    },
    {
      byType: {
        ai_summary: 0,
        audit: 0,
        booking: 0,
        call: 0,
        email: 0,
        note: 0,
        notification: 0,
        sms: 0,
        task: 0,
        workflow: 0,
      } as Record<FlowTimelineItem["type"], number>,
      count: 0,
    },
  );
}

