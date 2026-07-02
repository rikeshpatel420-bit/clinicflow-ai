import type { FlowFactoryBlueprint, FlowFactoryGeneratedProfile } from "@/lib/flow-factory";
import type { FlowBrandAccent } from "@/lib/flow-platform";

export type OnboardingCheckStatus = "complete" | "missing" | "warning";

export type OnboardingSummaryItem = {
  label: string;
  value: string;
};

export type OnboardingSectionSummary = {
  description: string;
  items: OnboardingSummaryItem[];
  title: string;
};

export type BusinessOnboardingBlueprint = FlowFactoryBlueprint & {
  businessAddress: string;
  businessEmail: string;
  businessHours: string;
  businessPhone: string;
  businessWebsite: string;
  ownerEmail: string;
  ownerName: string;
  serviceRadiusMiles: string;
  timezone: string;
};

export type OnboardingHealthCheck = {
  detail: string;
  id: string;
  label: string;
  status: OnboardingCheckStatus;
  value: string;
};

export type OnboardingHealthSummary = {
  checks: OnboardingHealthCheck[];
  completeCount: number;
  missing: string[];
  ready: boolean;
  score: number;
};

export type OnboardingGeneratedPackage = {
  blueprint: BusinessOnboardingBlueprint;
  brandEngine: OnboardingSectionSummary;
  bookingAbstraction: OnboardingSectionSummary;
  generatedProfile: FlowFactoryGeneratedProfile;
  knowledgeBase: OnboardingSectionSummary;
  organisationModel: OnboardingSectionSummary;
  platformHealth: OnboardingHealthSummary;
  promptStudio: OnboardingSectionSummary;
  settingsEngine: OnboardingSectionSummary;
};

export type OnboardingActionState = {
  generated?: OnboardingGeneratedPackage;
  message: string | null;
  status: "idle" | "error" | "success";
};

export type OnboardingPalette = {
  accent: FlowBrandAccent;
  background: string;
  primary: string;
  secondary: string;
  surface: string;
  text: string;
};

