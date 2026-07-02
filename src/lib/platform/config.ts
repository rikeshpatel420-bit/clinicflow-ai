import type { FeatureFlag, PlatformEvent, PlatformJob, PlatformModule } from "@/lib/platform/types";
import { getActiveFlowPlatformProfile } from "@/lib/flow-platform";

const activeFlowPlatformProfile = getActiveFlowPlatformProfile();

export const platformConfig = {
  environment: {
    appName: "ClinicFlow AI",
    mode: "demo",
    region: "uk-simulated",
    apiVersion: "v1-preview",
  },
  branding: {
    tenantName: activeFlowPlatformProfile.clinic.name,
    accent: activeFlowPlatformProfile.clinic.branding.accent,
    logoText: activeFlowPlatformProfile.clinic.branding.logoText,
    whiteLabelDomain: "clinicflow-demo.local",
  },
  modules: [
    { id: "core-auth", name: "Tenant auth shell", area: "core", status: "active", description: "Clinic-scoped account and role foundation." },
    { id: "events", name: "Internal event bus", area: "core", status: "beta", description: "Audit-safe event structure for workflows and notifications." },
    { id: "notifications", name: "Notification engine", area: "core", status: "active", description: "Profile-aware SMS, email, and internal notification dispatch." },
    { id: "audit", name: "Audit engine", area: "core", status: "active", description: "Reusable audit records for workflows, AI, escalation, and notifications." },
    { id: "timeline", name: "Timeline engine", area: "core", status: "active", description: "Unified customer activity timeline across calls, notes, tasks, and messages." },
    { id: "customer-360", name: "Customer 360", area: "core", status: "active", description: "Shared customer model for contact, history, and conversation data." },
    { id: "onboarding", name: "Customer onboarding", area: "core", status: "active", description: "Business setup wizard, brand engine, prompt studio, and self-validation package generation." },
    { id: "providers", name: "Provider abstraction", area: "integration", status: "active", description: "Connector-agnostic provider registry and sync model." },
    { id: "jobs", name: "Queue and scheduler", area: "automation", status: "planned", description: "Deterministic job architecture for future background processing." },
    { id: "search", name: "Global search", area: "enterprise", status: "planned", description: "Search framework across patients, calls, tasks, and clinics." },
  ] satisfies PlatformModule[],
  featureFlags: [
    { key: "ai_receptionist_demo", label: "AI receptionist demo", state: "enabled", scope: "clinic" },
    { key: "business_onboarding_wizard", label: "Business onboarding wizard", state: "enabled", scope: "clinic" },
    { key: "enterprise_governance", label: "Enterprise governance", state: "enterprise", scope: "enterprise" },
    { key: "live_twilio_webhooks", label: "Live Twilio webhooks", state: "disabled", scope: "internal" },
    { key: "stripe_billing", label: "Stripe billing", state: "disabled", scope: "internal" },
    { key: "global_search_preview", label: "Global search preview", state: "internal", scope: "global" },
  ] satisfies FeatureFlag[],
  jobs: [
    { id: "job-1", name: "Daily owner briefing", queue: "briefings", status: "scheduled", scheduledFor: "Tomorrow 07:30" },
    { id: "job-2", name: "SLA risk scan", queue: "operations", status: "completed", scheduledFor: "Today 10:00" },
    { id: "job-3", name: "Inactive patient reactivation check", queue: "revenue", status: "queued", scheduledFor: "Today 15:00" },
  ] satisfies PlatformJob[],
  events: [
    { id: "evt-1", topic: "patient.lead_scored", producer: "revenue-ops", consumer: "notifications", auditSafe: true, createdAt: "Today 10:14" },
    { id: "evt-2", topic: "workflow.escalated", producer: "automation-engine", consumer: "activity-feed", auditSafe: true, createdAt: "Today 10:18" },
    { id: "evt-3", topic: "sync.job_retry", producer: "sync-engine", consumer: "admin-monitor", auditSafe: true, createdAt: "Today 10:22" },
    { id: "evt-4", topic: "business.onboarded", producer: "onboarding-engine", consumer: "platform-health", auditSafe: true, createdAt: "Today 10:27" },
  ] satisfies PlatformEvent[],
  health: [
    { service: "Next.js app shell", status: "operational", uptime: "99.99%" },
    { service: "Supabase connection layer", status: "operational", uptime: "live" },
    { service: "Internal queues", status: "operational", uptime: "profile-driven" },
    { service: "Onboarding engine", status: "operational", uptime: "wizard-driven" },
    { service: "Webhook gateway", status: "operational", uptime: "ready" },
  ],
};

