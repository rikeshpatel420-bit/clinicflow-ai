import type { FieldMapping, IntegrationConnection, SyncJob, WebhookEvent } from "@/lib/integrations/types";
import { providerRegistry } from "@/lib/integrations/registry";

export const integrationDemo = {
  providers: providerRegistry,
  connections: [
    {
      id: "conn-1",
      provider: "dentally",
      status: "connected",
      healthScore: 94,
      lastSyncAt: "Today, 10:12",
      externalAccountLabel: "Harbour Dental Group",
    },
    {
      id: "conn-2",
      provider: "twilio",
      status: "paused",
      healthScore: 76,
      lastSyncAt: "Demo only",
      externalAccountLabel: "Test communications workspace",
    },
    {
      id: "conn-3",
      provider: "hubspot",
      status: "degraded",
      healthScore: 68,
      lastSyncAt: "Yesterday, 17:45",
      externalAccountLabel: "Marketing pipeline sandbox",
    },
  ] satisfies IntegrationConnection[],
  syncJobs: [
    {
      id: "sync-1",
      provider: "dentally",
      objectType: "patients",
      status: "completed",
      recordsProcessed: 428,
      failures: 0,
      retryCount: 0,
      startedAt: "Today, 10:10",
      summary: "Patient external IDs mapped to clinic-scoped records.",
    },
    {
      id: "sync-2",
      provider: "google_calendar",
      objectType: "events",
      status: "running",
      recordsProcessed: 64,
      failures: 0,
      retryCount: 0,
      startedAt: "Today, 10:19",
      summary: "Availability snapshot building for appointment risk monitoring.",
    },
    {
      id: "sync-3",
      provider: "hubspot",
      objectType: "contacts",
      status: "retrying",
      recordsProcessed: 91,
      failures: 3,
      retryCount: 2,
      startedAt: "Today, 09:55",
      summary: "Retrying records with missing consent source mapping.",
    },
  ] satisfies SyncJob[],
  fieldMappings: [
    { source: "external_patient_id", destination: "patients.external_refs.dentally_id", transform: "store external ID relationship" },
    { source: "mobile_phone", destination: "patients.phone", transform: "normalise UK phone format" },
    { source: "appointment_start", destination: "appointments.starts_at", transform: "convert provider timezone to clinic timezone" },
    { source: "lead_source", destination: "recovery_opportunities.source", transform: "map to attribution channel" },
  ] satisfies FieldMapping[],
  webhookEvents: [
    { id: "webhook-1", provider: "twilio", eventType: "call.status.changed", status: "accepted", receivedAt: "2 min ago" },
    { id: "webhook-2", provider: "dentally", eventType: "appointment.updated", status: "accepted", receivedAt: "11 min ago" },
    { id: "webhook-3", provider: "hubspot", eventType: "contact.deleted", status: "ignored", receivedAt: "22 min ago" },
  ] satisfies WebhookEvent[],
  metrics: [
    { label: "Connected systems", value: "3", note: "demo active" },
    { label: "Records synced today", value: "583", note: "simulated" },
    { label: "Retry queue", value: "3", note: "audit-safe" },
    { label: "Avg health", value: "79%", note: "provider score" },
  ],
};

