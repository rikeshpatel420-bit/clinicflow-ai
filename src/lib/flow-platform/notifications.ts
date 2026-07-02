import { createFlowEvent, createFlowEventBus, listFlowEventTopics } from "./events";
import { buildFlowTemplateRegistry, getFlowTemplateDefinition, renderFlowTemplate } from "./templates";
import type {
  FlowNotificationDispatchRecord,
  FlowNotificationDispatchStatus,
  FlowNotificationRule,
  FlowPlatformProfile,
  FlowTemplateChannel,
  FlowTemplatePriority,
  FlowTemplateRegistry,
} from "./types";

export type FlowNotificationTransportResult = {
  messageId?: string;
  provider?: string;
  queued?: boolean;
  success: boolean;
};

export type FlowNotificationTransport = (input: {
  body: string;
  channel: FlowTemplateChannel;
  priority: FlowTemplatePriority;
  subject?: string;
  templateId: string;
  variables: Record<string, string>;
}) => Promise<FlowNotificationTransportResult> | FlowNotificationTransportResult;

export type FlowNotificationEngineOptions = {
  audit?: (record: FlowNotificationDispatchRecord) => Promise<void> | void;
  eventBus?: ReturnType<typeof createFlowEventBus>;
  logger?: Pick<Console, "error" | "info" | "warn">;
  profileId: string;
  transports?: Partial<Record<FlowTemplateChannel, FlowNotificationTransport>>;
  templateRegistry?: FlowTemplateRegistry;
};

export type FlowNotificationDispatchInput = {
  clinicId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
  priority?: FlowTemplatePriority;
  profileId?: string;
  retryCount?: number;
  templateId: string;
  variables?: Record<string, string>;
};

export type FlowNotificationEngineSnapshot = {
  availableChannels: readonly FlowTemplateChannel[];
  templates: readonly string[];
  topics: readonly string[];
};

const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_PRIORITY: FlowTemplatePriority = "normal";

function normalizeVariables(variables: Record<string, string> | undefined, templateVariables: readonly string[]) {
  const resolved: Record<string, string> = {};

  for (const variable of templateVariables) {
    const key = variable.replace(/^{{|}}$/g, "");
    resolved[key] = variables?.[key] ?? variable;
  }

  for (const [key, value] of Object.entries(variables ?? {})) {
    resolved[key] = value;
  }

  return resolved;
}

function createDispatchRecord(input: {
  channel: FlowTemplateChannel;
  clinicId: string | null;
  eventType: string;
  outcome: FlowNotificationDispatchStatus;
  profileId: string;
  priority: FlowTemplatePriority;
  retryCount: number;
  templateId: string;
  templateTitle: string;
  variables: Record<string, string>;
  metadata?: Record<string, unknown>;
  error?: string;
}): FlowNotificationDispatchRecord {
  return {
    channel: input.channel,
    clinicId: input.clinicId,
    createdAt: new Date().toISOString(),
    eventType: input.eventType,
    error: input.error,
    id: `flow_notification_${input.templateId}_${Date.now()}`,
    metadata: input.metadata,
    outcome: input.outcome,
    profileId: input.profileId,
    priority: input.priority,
    retryCount: input.retryCount,
    templateId: input.templateId,
    templateTitle: input.templateTitle,
    variables: input.variables,
  };
}

export function createFlowNotificationEngine(options: FlowNotificationEngineOptions) {
  const registry = options.templateRegistry ?? buildFlowTemplateRegistry(({
    clinic: { name: "Flow Platform" },
    conversation: {
      leads: {
        templates: {
          email: { body: "Thanks for getting in touch.", subject: "Thanks for contacting us" },
          sms: {
            help: "Thanks for getting in touch.",
            missedCallRecovery: "Hi, sorry we missed your call. Reply YES and we'll call you back.",
            optOut: "You've been opted out.",
            replyYes: "Thanks. We'll call you back shortly.",
            resubscribe: "You're back on the list.",
          },
        },
      },
    },
    industry: { description: "Generic Flow Platform services", key: "services", name: "Services", terminology: ["customer", "lead", "workflow"] },
    id: options.profileId,
  } as unknown as FlowPlatformProfile<string, string, string, string, string>));
  const eventBus = options.eventBus ?? createFlowEventBus();
  const history: FlowNotificationDispatchRecord[] = [];

  async function dispatch(input: FlowNotificationDispatchInput) {
    const template = getFlowTemplateDefinition(registry, input.templateId);
    if (!template) {
      const record = createDispatchRecord({
        channel: "internal",
        clinicId: input.clinicId ?? null,
        eventType: input.eventType,
        error: `Template ${input.templateId} is not registered.`,
        outcome: "failed",
        profileId: input.profileId ?? options.profileId,
        priority: input.priority ?? DEFAULT_PRIORITY,
        retryCount: input.retryCount ?? DEFAULT_RETRY_COUNT,
        templateId: input.templateId,
        templateTitle: input.templateId,
        variables: input.variables ?? {},
        metadata: input.metadata,
      });
      history.push(record);
      options.logger?.warn("[Flow Notifications] template missing", {
        eventType: input.eventType,
        profileId: record.profileId,
        templateId: input.templateId,
      });
      return record;
    }

    const resolvedVariables = normalizeVariables(input.variables, template.variables);
    const rendered = renderFlowTemplate(template, resolvedVariables);
    const retryCount = input.retryCount ?? DEFAULT_RETRY_COUNT;
    const priority = input.priority ?? template.priority ?? DEFAULT_PRIORITY;

    if (template.channel === "whatsapp" || template.channel === "push") {
      const record = createDispatchRecord({
        channel: template.channel,
        clinicId: input.clinicId ?? null,
        eventType: input.eventType,
        outcome: "unavailable",
        profileId: input.profileId ?? options.profileId,
        priority,
        retryCount,
        templateId: template.id,
        templateTitle: template.title,
        variables: resolvedVariables,
        metadata: input.metadata,
      });
      history.push(record);
      return record;
    }

    const transport = options.transports?.[template.channel];
    if (!transport) {
      const record = createDispatchRecord({
        channel: template.channel,
        clinicId: input.clinicId ?? null,
        eventType: input.eventType,
        outcome: "queued",
        profileId: input.profileId ?? options.profileId,
        priority,
        retryCount,
        templateId: template.id,
        templateTitle: template.title,
        variables: resolvedVariables,
        metadata: input.metadata,
      });
      history.push(record);
      options.logger?.info("[Flow Notifications] queued without transport", {
        channel: template.channel,
        eventType: input.eventType,
        profileId: record.profileId,
        templateId: template.id,
      });
      return record;
    }

    try {
      const result = await transport({
        body: rendered.body,
        channel: template.channel,
        priority,
        subject: rendered.subject,
        templateId: template.id,
        variables: resolvedVariables,
      });

      const record = createDispatchRecord({
        channel: template.channel,
        clinicId: input.clinicId ?? null,
        eventType: input.eventType,
        outcome: result.success ? (result.queued ? "queued" : "sent") : "failed",
        profileId: input.profileId ?? options.profileId,
        priority,
        retryCount,
        templateId: template.id,
        templateTitle: template.title,
        variables: resolvedVariables,
        metadata: { ...input.metadata, provider: result.provider, messageId: result.messageId, queued: result.queued },
        error: result.success ? undefined : "Transport reported failure.",
      });
      history.push(record);

      try {
        await options.audit?.(record);
      } catch (error) {
        options.logger?.warn("[Flow Notifications] audit hook failed", {
          channel: template.channel,
          eventType: input.eventType,
          profileId: record.profileId,
          templateId: template.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        await eventBus.emit(createFlowEvent("notification.sent", { ...record, templateBody: rendered.body }, record.profileId, record.clinicId));
      } catch (error) {
        options.logger?.warn("[Flow Notifications] event emission failed", {
          channel: template.channel,
          eventType: input.eventType,
          profileId: record.profileId,
          templateId: template.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return record;
    } catch (error) {
      const record = createDispatchRecord({
        channel: template.channel,
        clinicId: input.clinicId ?? null,
        eventType: input.eventType,
        error: error instanceof Error ? error.message : String(error),
        outcome: "failed",
        profileId: input.profileId ?? options.profileId,
        priority,
        retryCount,
        templateId: template.id,
        templateTitle: template.title,
        variables: resolvedVariables,
        metadata: input.metadata,
      });
      history.push(record);
      options.logger?.error("[Flow Notifications] dispatch failed", {
        channel: template.channel,
        eventType: input.eventType,
        profileId: record.profileId,
        templateId: template.id,
      });
      return record;
    }
  }

  return {
    dispatch,
    history: () => [...history],
    registry,
    snapshot(): FlowNotificationEngineSnapshot {
      return {
        availableChannels: [...new Set(registry.templates.map((template) => template.channel))],
        templates: registry.templates.map((template) => template.id),
        topics: listFlowEventTopics(),
      };
    },
  };
}

export function buildNotificationRules(profile: FlowPlatformProfile<string, string, string, string, string>): FlowNotificationRule[] {
  const profileName = profile.clinic.name;

  return [
    { channel: "sms", key: "missed-call-recovery", priority: "high", template: profile.conversation.leads.templates.sms.missedCallRecovery, templateId: "missed-call", trigger: "call.missed", variables: ["customerName", "followUpTime", "clinicName"] },
    { channel: "email", key: "lead-escalation", priority: "urgent", template: profile.conversation.leads.templates.email.body, templateId: "new-lead", trigger: "lead.created", variables: ["customerName", "industryName", "clinicName"] },
    { channel: "dashboard", key: "call-summary-ready", priority: "normal", template: `Show the summary on the live dashboard as soon as the call is captured for ${profileName}.`, templateId: "booking-received", trigger: "call.summary.created", variables: ["clinicName"] },
  ];
}

export function summarizeNotificationRules(rules: readonly FlowNotificationRule[]) {
  return {
    channels: [...new Set(rules.map((rule) => rule.channel))],
    count: rules.length,
    triggers: [...new Set(rules.map((rule) => rule.trigger))],
  };
}
