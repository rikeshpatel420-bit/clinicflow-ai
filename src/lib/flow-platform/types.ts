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
  clinicalSummary: string;
  followUpRecommendation: string;
  patientSummary: string;
  receptionNotes: string;
  sms: string;
  email: string;
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
  fallbackIntent: TIntent;
  fallbackPrompt: string;
  intentDefinitions: readonly FlowIntentDefinition<TIntent>[];
  summaryTemplates: FlowSummaryTemplates;
  templates: FlowMessageTemplates;
  businessHoursPrompt: string;
  conversationTone: string;
  language: string;
};

export type FlowVoiceProfile<TVoiceIntent extends string, TVoiceEntity extends string = never, TTreatmentIntent extends string = never> =
  FlowConversationProfile<TVoiceIntent, TVoiceEntity> & {
    closing: string;
    emergencyPrompt: string;
    empathy: string;
    greeting: string;
    industryTerminology: string[];
    pronunciations: readonly { sayAs: string; term: string }[];
    speechRate: string;
    ssmlBreakMs: number;
    ssmlEnabled: boolean;
    treatmentDefinitions: readonly FlowIntentDefinition<TTreatmentIntent>[];
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

export type FlowWorkflowDefinition = {
  channel: "workflow" | "sms" | "email" | "voice";
  description: string;
  handler: string;
  key: string;
  label: string;
  trigger: string;
};

export type FlowNotificationRule = {
  channel: "dashboard" | "email" | "sms";
  key: string;
  template: string;
  trigger: string;
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

