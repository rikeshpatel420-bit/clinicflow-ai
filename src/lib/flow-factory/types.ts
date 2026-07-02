import type { FlowBrandAccent } from "@/lib/flow-platform";

export type FlowFactoryColourPalette = {
  accent: FlowBrandAccent;
  background: string;
  primary: string;
  secondary: string;
  surface: string;
  text: string;
};

export type FlowFactoryDashboardWording = {
  activeCalls: string;
  followUp: string;
  missedCalls: string;
  recovery: string;
  revenueRecovered: string;
  responseRate: string;
};

export type FlowFactoryBlueprint = {
  aiPrompt: string;
  bookingBehaviour: string;
  calendarProvider: string;
  businessName: string;
  colours: FlowFactoryColourPalette;
  crmFields: string[];
  dashboardWording: FlowFactoryDashboardWording;
  emailTemplates: {
    body: string;
    subject: string;
  };
  emergencyRules: string[];
  escalationRules: string[];
  followUpCadence: string;
  greeting: string;
  industry: string;
  logo: string;
  questionsToAsk: string[];
  requiredCustomerInformation: string[];
  smsTemplates: {
    help: string;
    missedCallRecovery: string;
    optOut: string;
    replyYes: string;
    resubscribe: string;
  };
  tone: string;
  voicePersonality: string;
  workflowStages: string[];
  voice?: string;
  speechRate?: string;
  ssmlEnabled?: boolean;
  language?: string;
};

export type FlowFactoryArtifact = {
  content: string;
  description: string;
  filename: string;
};

export type FlowFactoryRoutePlan = {
  description: string;
  href: string;
  label: string;
};

export type FlowFactoryDashboardCard = {
  description: string;
  id: string;
  label: string;
};

export type FlowFactoryWorkflowBlueprint = {
  channel: "email" | "sms" | "voice" | "workflow";
  description: string;
  key: string;
  label: string;
  trigger: string;
};

export type FlowFactoryNotificationTemplate = {
  body: string;
  channel: "dashboard" | "email" | "internal" | "push" | "sms" | "whatsapp";
  id: string;
  label: string;
  subject?: string;
};

export type FlowFactoryPromptProfile = {
  aiPrompt: string;
  greeting: string;
  language: string;
  tone: string;
  voicePersonality: string;
};

export type FlowFactoryPlatformDefaults = {
  branding: FlowFactoryColourPalette;
  dashboardCards: FlowFactoryDashboardCard[];
  navigation: FlowFactoryRoutePlan[];
  notificationTemplates: FlowFactoryNotificationTemplate[];
  promptProfile: FlowFactoryPromptProfile;
  sampleAutomationRules: string[];
  voiceProfile: {
    language: string;
    rate: string;
    ssmlEnabled: boolean;
    voice: string;
  };
  workflowBlueprints: FlowFactoryWorkflowBlueprint[];
};

export type FlowFactoryGeneratedProfile = {
  blueprint: FlowFactoryBlueprint;
  dashboard: {
    colors: FlowFactoryColourPalette;
    labels: {
      activeCalls: string;
      followUp: string;
      missedCalls: string;
      recovery: string;
      revenueRecovered: string;
      responseRate: string;
    };
  };
  documentation: string;
  files: FlowFactoryArtifact[];
  intentSummary: {
    entityCount: number;
    intentCount: number;
    workflowCount: number;
  };
  profileId: string;
  platformDefaults: FlowFactoryPlatformDefaults;
  routes: FlowFactoryRoutePlan[];
  tests: string;
  voice: {
    empathy: string;
    greeting: string;
    language: string;
    personality: string;
    rate: string;
    ssmlEnabled: boolean;
    voice: string;
  };
  workflowStages: string[];
};
