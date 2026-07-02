export type FlowBrandAccent = "teal" | "blue" | "green" | "amber" | "violet" | "rose";

export type FlowIndustryConfig = {
  description: string;
  key: string;
  name: string;
  terminology: string[];
};

export type FlowClinicBranding = {
  accent: FlowBrandAccent;
  background: string;
  icon: string;
  logoText: string;
  primary: string;
  secondary: string;
  surface: string;
  text: string;
};

export type FlowSummaryTemplates = {
  appointmentRecommendation: string;
  caseSummary: string;
  followUpRecommendation: string;
  patientSummary: string;
  receptionNotes: string;
  sms: string;
  email: string;
  clinicalSummary?: string;
};

export type FlowMessageTemplates = {
  sms: {
    help: string;
    missedCallRecovery: string;
    optOut: string;
    replyYes: string;
    resubscribe: string;
  };
  email: {
    subject: string;
    body: string;
  };
};

export type FlowTemplateChannel = "sms" | "email" | "whatsapp" | "push" | "internal" | "dashboard";
export type FlowTemplatePriority = "low" | "normal" | "high" | "urgent";

export type FlowTemplateDefinition = {
  body: string;
  channel: FlowTemplateChannel;
  description: string;
  id: string;
  priority?: FlowTemplatePriority;
  profileOverride?: boolean;
  subject?: string;
  title: string;
  variables: readonly string[];
};

export type FlowTemplateRegistry = {
  defaultTemplateCount: number;
  overrideTemplateCount: number;
  profileId: string;
  profileName: string;
  templates: readonly FlowTemplateDefinition[];
};

export type FlowIntentDefinition<TIntent extends string> = {
  followUpQuestion: string;
  intent: TIntent;
  keywords: readonly string[];
  label: string;
  priority?: number;
  summaryHint: string;
  escalate?: boolean;
};

export type FlowEntityDefinition<TEntity extends string> = {
  entity: TEntity;
  label: string;
  normalize?: (value: string) => string;
  patterns: readonly RegExp[];
};

export type FlowConversationProfile<TIntent extends string, TEntity extends string = never> = {
  clarificationPrompt: string;
  entityDefinitions: readonly FlowEntityDefinition<TEntity>[];
  escalationIntents: readonly TIntent[];
  escalationRules: readonly string[];
  fallbackIntent: TIntent;
  fallbackPrompt: string;
  intentDefinitions: readonly FlowIntentDefinition<TIntent>[];
  recoveryRules: readonly string[];
  summaryTemplates: FlowSummaryTemplates;
  templates: FlowMessageTemplates;
  urgencyRules: readonly string[];
  businessHoursPrompt: string;
  conversationTone: string;
  language: string;
};

export type FlowVoiceProfile<TVoiceIntent extends string, TVoiceEntity extends string = never, TTreatmentIntent extends string = never> =
  FlowConversationProfile<TVoiceIntent, TVoiceEntity> & {
    actionDefinitions: readonly FlowIntentDefinition<TTreatmentIntent>[];
    closing: string;
    emergencyPrompt: string;
    empathy: string;
    greeting: string;
    industryTerminology: string[];
    pronunciations: readonly { sayAs: string; term: string }[];
    speechRate: string;
    ssmlBreakMs: number;
    ssmlEnabled: boolean;
    treatmentDefinitions?: readonly FlowIntentDefinition<TTreatmentIntent>[];
    voice: string;
  };

export type FlowKnowledgePrompt = {
  key: string;
  prompt: string;
  title: string;
};

export type FlowKnowledgeBase = {
  businessRules: string[];
  entityCatalog: readonly FlowEntityDefinition<string>[];
  prompts: readonly FlowKnowledgePrompt[];
  safeResponses: string[];
};

export type FlowWorkflowTrigger =
  | "inbound_call_completed"
  | "missed_call"
  | "emergency_detected"
  | "new_lead_created"
  | "appointment_requested"
  | "message_received"
  | "quote_requested"
  | "human_transfer_requested"
  | "follow_up_due"
  | "payment_due"
  | "review_request_due"
  | "twilio.call.received"
  | "twilio.voice.received"
  | "twilio.voice.speech"
  | "twilio.sms.received"
  | "twilio.call.missed"
  | "call.missed"
  | "call.summary.requested"
  | "call.summary.created"
  | (string & {});

export type FlowWorkflowStatus = "active" | "draft" | "paused" | "archived";

export type FlowWorkflowConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "in"
  | "not_in"
  | "starts_with"
  | "ends_with"
  | "exists"
  | "missing"
  | "truthy"
  | "falsy"
  | "matches";

export type FlowWorkflowConditionValue = string | number | boolean | readonly (string | number | boolean)[];

export type FlowWorkflowCondition = {
  field: string;
  label: string;
  operator: FlowWorkflowConditionOperator;
  value?: FlowWorkflowConditionValue;
  description?: string;
};

export type FlowWorkflowActionType =
  | "classify_intent"
  | "create_lead"
  | "update_customer"
  | "create_task"
  | "send_sms"
  | "send_email"
  | "notify_staff"
  | "schedule_callback"
  | "escalate"
  | "add_note"
  | "assign_owner"
  | "create_booking_request"
  | "update_call_summary"
  | "mark_recovery_status"
  | "trigger_webhook"
  | "extract_entities"
  | "score_urgency"
  | "update_dashboard"
  | "handoff_to_human";

export type FlowWorkflowAction = {
  id: string;
  type: FlowWorkflowActionType;
  label: string;
  description: string;
  payload?: Record<string, unknown>;
  enabled?: boolean;
};

export type FlowWorkflowStep = {
  actionIds: readonly string[];
  conditionMode?: "all" | "any";
  conditions?: readonly FlowWorkflowCondition[];
  continueOnError?: boolean;
  description: string;
  fallbackActionIds?: readonly string[];
  id: string;
  label: string;
};

export type FlowWorkflowFallback = {
  actionIds: readonly string[];
  description: string;
  label: string;
};

export type FlowWorkflowAuditTrail = {
  enabled: boolean;
  entityTable: string;
  eventTypes: readonly string[];
  note: string;
  riskLevel?: "low" | "medium" | "high";
};

export type FlowWorkflowDefinition = {
  channel: "workflow" | "sms" | "email" | "voice";
  actions?: readonly FlowWorkflowAction[];
  auditTrail?: FlowWorkflowAuditTrail;
  conditions?: readonly FlowWorkflowCondition[];
  description: string;
  fallback?: FlowWorkflowFallback;
  handler: string;
  key: string;
  label: string;
  profileId?: string;
  status?: FlowWorkflowStatus;
  steps?: readonly FlowWorkflowStep[];
  trigger: FlowWorkflowTrigger;
};

export type FlowNotificationRule = {
  channel: "dashboard" | "email" | "internal" | "push" | "sms" | "whatsapp";
  key: string;
  priority?: FlowTemplatePriority;
  profileOverride?: boolean;
  retryCount?: number;
  template: string;
  templateId?: string;
  variables?: readonly string[];
  trigger: string;
};

export type FlowNotificationDispatchStatus = "sent" | "queued" | "skipped" | "unavailable" | "failed";

export type FlowNotificationDispatchRecord = {
  channel: FlowNotificationRule["channel"];
  clinicId: string | null;
  createdAt: string;
  eventType: string;
  error?: string;
  id: string;
  metadata?: Record<string, unknown>;
  outcome: FlowNotificationDispatchStatus;
  profileId: string;
  priority: FlowTemplatePriority;
  retryCount: number;
  templateId: string;
  templateTitle: string;
  variables: Record<string, string>;
};

export type FlowEventTopic =
  | "call.completed"
  | "call.missed"
  | "lead.created"
  | "booking.requested"
  | "quote.requested"
  | "payment.received"
  | "customer.created"
  | "workflow.completed"
  | "notification.sent"
  | "timeline.recorded"
  | "audit.recorded"
  | "human.transfer.requested"
  | (string & {});

export type FlowEventRecord = {
  clinicId: string | null;
  createdAt: string;
  id: string;
  metadata?: Record<string, unknown>;
  payload: Record<string, unknown>;
  profileId: string;
  source: string;
  topic: FlowEventTopic;
};

export type FlowEventSubscriber = (event: FlowEventRecord) => void | Promise<void>;

export type FlowAuditCategory = "ai" | "booking" | "customer" | "notification" | "timeline" | "transfer" | "workflow" | "escalation";

export type FlowAuditRecord = {
  actor?: string;
  category: FlowAuditCategory;
  clinicId: string | null;
  createdAt: string;
  detail: string;
  entityId?: string;
  entityType?: string;
  eventType: string;
  id: string;
  metadata?: Record<string, unknown>;
  outcome: "info" | "success" | "failed" | "skipped";
  profileId: string;
};

export type FlowTimelineItemType = "ai_summary" | "audit" | "booking" | "call" | "email" | "note" | "notification" | "sms" | "task" | "workflow";

export type FlowTimelineItem = {
  clinicId: string | null;
  createdAt: string;
  detail: string;
  direction?: "inbound" | "internal" | "outbound";
  entityId?: string;
  id: string;
  metadata?: Record<string, unknown>;
  profileId: string;
  status?: string;
  title: string;
  type: FlowTimelineItemType;
};

export type FlowCustomerCommunication = {
  channel: Exclude<FlowTimelineItemType, "audit" | "booking" | "call" | "note" | "task" | "workflow"> | "call";
  createdAt: string;
  detail: string;
  id: string;
  status: string;
};

export type FlowCustomer360 = {
  aiNotes: readonly string[];
  appointments: readonly {
    id: string;
    status: string;
    startsAt?: string;
    summary: string;
  }[];
  addresses: readonly string[];
  clinicId: string | null;
  communications: readonly FlowCustomerCommunication[];
  contact: {
    email?: string;
    fullName: string;
    phone?: string;
  };
  conversationSummaries: readonly string[];
  history: readonly FlowTimelineItem[];
  id: string;
  invoices: readonly {
    id: string;
    note: string;
    status: string;
  }[];
  intentHistory: readonly string[];
  jobs: readonly {
    id: string;
    status: string;
    summary: string;
  }[];
  metadata?: Record<string, unknown>;
  profileId: string;
  tags: readonly string[];
};

export type FlowDashboardTheme = {
  colors: {
    background: string;
    primary: string;
    secondary: string;
    surface: string;
    text: string;
  };
  icons: string[];
  labels: {
    activeCalls: string;
    followUp: string;
    missedCalls: string;
    recovery: string;
    revenueRecovered: string;
    responseRate: string;
  };
};

export type FlowClinicConfig = {
  appointmentRules: string[];
  businessHours: string;
  locale: string;
  name: string;
  region: string;
  branding: FlowClinicBranding;
};

export type FlowPlatformProfile<
  TVoiceIntent extends string,
  TVoiceEntity extends string,
  TTreatmentIntent extends string,
  TLeadIntent extends string,
  TLeadEntity extends string = never,
> = {
  clinic: FlowClinicConfig;
  conversation: {
    leads: FlowConversationProfile<TLeadIntent, TLeadEntity>;
    voice: FlowVoiceProfile<TVoiceIntent, TVoiceEntity, TTreatmentIntent>;
  };
  dashboard: FlowDashboardTheme;
  industry: FlowIndustryConfig;
  id: string;
  knowledgeBase: FlowKnowledgeBase;
  notifications: readonly FlowNotificationRule[];
  workflows: readonly FlowWorkflowDefinition[];
};
