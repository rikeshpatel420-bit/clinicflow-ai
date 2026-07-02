import type { FlowEventRecord, FlowEventSubscriber, FlowEventTopic } from "./types";

export type FlowEventBusListener = {
  id: string;
  once?: boolean;
  topic: FlowEventTopic;
  handler: FlowEventSubscriber;
};

export type FlowEventBusSnapshot = {
  listenerCount: number;
  topics: readonly FlowEventTopic[];
};

const DEFAULT_FLOW_EVENT_TOPICS: readonly FlowEventTopic[] = [
  "call.completed",
  "call.missed",
  "lead.created",
  "booking.requested",
  "quote.requested",
  "payment.received",
  "customer.created",
  "workflow.completed",
  "notification.sent",
  "timeline.recorded",
  "audit.recorded",
  "human.transfer.requested",
];

export function createFlowEvent(topic: FlowEventTopic, payload: Record<string, unknown>, profileId: string, clinicId: string | null = null, metadata?: Record<string, unknown>): FlowEventRecord {
  return {
    clinicId,
    createdAt: new Date().toISOString(),
    id: `flow_evt_${topic}_${Date.now()}`,
    metadata,
    payload,
    profileId,
    source: "flow-platform",
    topic,
  };
}

export function createFlowEventBus(initialTopics: readonly FlowEventTopic[] = DEFAULT_FLOW_EVENT_TOPICS) {
  const listeners = new Map<FlowEventTopic, FlowEventBusListener[]>();

  for (const topic of initialTopics) {
    listeners.set(topic, []);
  }

  return {
    async emit(event: FlowEventRecord) {
      const handlers = [...(listeners.get(event.topic) ?? [])];

      for (const listener of handlers) {
        await listener.handler(event);
        if (listener.once) {
          const bucket = listeners.get(listener.topic) ?? [];
          listeners.set(
            listener.topic,
            bucket.filter((item) => item.id !== listener.id),
          );
        }
      }

      return event;
    },
    on(topic: FlowEventTopic, handler: FlowEventSubscriber, options: { once?: boolean } = {}) {
      const listener: FlowEventBusListener = {
        handler,
        id: `listener_${topic}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        once: options.once,
        topic,
      };

      const bucket = listeners.get(topic) ?? [];
      bucket.push(listener);
      listeners.set(topic, bucket);

      return () => {
        const current = listeners.get(topic) ?? [];
        listeners.set(
          topic,
          current.filter((item) => item.id !== listener.id),
        );
      };
    },
    snapshot(): FlowEventBusSnapshot {
      return {
        listenerCount: [...listeners.values()].reduce((total, bucket) => total + bucket.length, 0),
        topics: [...listeners.keys()],
      };
    },
  };
}

export function listFlowEventTopics() {
  return [...DEFAULT_FLOW_EVENT_TOPICS];
}

export function isFlowEventTopic(topic: string): topic is FlowEventTopic {
  return DEFAULT_FLOW_EVENT_TOPICS.includes(topic as FlowEventTopic);
}

export function buildFlowEventTopicSummary() {
  return {
    registeredTopics: DEFAULT_FLOW_EVENT_TOPICS.length,
    topics: listFlowEventTopics(),
  };
}
