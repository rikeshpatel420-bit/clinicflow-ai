export type ProviderKey =
  | "dentally"
  | "soe"
  | "exact"
  | "hubspot"
  | "twilio"
  | "google_calendar"
  | "microsoft_outlook"
  | "email"
  | "whatsapp"
  | "stripe"
  | "webhooks"
  | "zapier"
  | "make"
  | "n8n";
export type ProviderCategory = "practice_management" | "crm" | "communications" | "calendar" | "billing" | "automation" | "webhooks";
export type IntegrationStatus = "not_connected" | "connected" | "degraded" | "paused" | "error";
export type SyncJobStatus = "queued" | "running" | "completed" | "failed" | "retrying";

export type ProviderDefinition = {
  key: ProviderKey;
  name: string;
  category: ProviderCategory;
  description: string;
  supportedObjects: string[];
};

export type IntegrationConnection = {
  id: string;
  provider: ProviderKey;
  status: IntegrationStatus;
  healthScore: number;
  lastSyncAt: string;
  externalAccountLabel: string;
};

export type SyncJob = {
  id: string;
  provider: ProviderKey;
  objectType: string;
  status: SyncJobStatus;
  recordsProcessed: number;
  failures: number;
  retryCount: number;
  startedAt: string;
  summary: string;
};

export type FieldMapping = {
  source: string;
  destination: string;
  transform: string;
};

export type WebhookEvent = {
  id: string;
  provider: ProviderKey;
  eventType: string;
  status: "accepted" | "ignored" | "failed";
  receivedAt: string;
};

