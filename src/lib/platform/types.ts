export type PlatformModuleStatus = "active" | "beta" | "planned" | "disabled";
export type FeatureFlagState = "enabled" | "disabled" | "internal" | "enterprise";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "scheduled";
export type SystemHealth = "operational" | "degraded" | "maintenance";

export type PlatformModule = {
  id: string;
  name: string;
  area: "core" | "integration" | "automation" | "analytics" | "enterprise";
  status: PlatformModuleStatus;
  description: string;
};

export type FeatureFlag = {
  key: string;
  label: string;
  state: FeatureFlagState;
  scope: "global" | "clinic" | "enterprise" | "internal";
};

export type PlatformJob = {
  id: string;
  name: string;
  queue: string;
  status: JobStatus;
  scheduledFor: string;
};

export type PlatformEvent = {
  id: string;
  topic: string;
  producer: string;
  consumer: string;
  auditSafe: boolean;
  createdAt: string;
};

