export type EventTopic =
  | "auth.session_started"
  | "tenant.context_resolved"
  | "crm.pipeline_updated"
  | "billing.subscription_changed"
  | "ai.workflow_requested"
  | "webhook.received"
  | "audit.recorded";

export type AppEvent<TPayload = Record<string, unknown>> = {
  id: string;
  topic: EventTopic;
  clinicId: string | null;
  payload: TPayload;
  createdAt: string;
};

export function createAppEvent<TPayload>(topic: EventTopic, payload: TPayload, clinicId: string | null = null): AppEvent<TPayload> {
  return {
    clinicId,
    createdAt: new Date().toISOString(),
    id: `evt_${topic}_${Date.now()}`,
    payload,
    topic,
  };
}

export function publishDemoEvent<TPayload>(event: AppEvent<TPayload>) {
  return { accepted: true, event, mode: "demo" as const };
}

