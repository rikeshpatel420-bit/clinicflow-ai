import { billingPlans } from "@/lib/billing/plans";
import { accountQuotas } from "@/lib/billing/quotas";
import { getBackendEnv, type BackendEnv } from "@/lib/backend/env";
import { providerRegistry } from "@/lib/integrations/registry";
import { clinicRoles, roleLabels, rolePermissions } from "@/lib/permissions/roles";
import { platformConfig } from "@/lib/platform/config";
import type { SaasApiKeySetting, SaasBillingTier, SaasCapability, SaasPermissionSummary } from "./types";

export function buildSaasCapabilityCatalog(): SaasCapability[] {
  return [
    {
      area: "core",
      description: "Clinic-scoped workspace isolation, membership context, and tenant filters keep every query inside the active clinic.",
      evidence: ["src/lib/tenancy/context.ts", "src/lib/backend/tenant-scope.ts", "/system"],
      id: "tenant-isolation",
      label: "Tenant isolation",
      status: "active",
    },
    {
      area: "core",
      description: "Roles and permissions define who can read patients, manage billing, invite staff, and adjust governance.",
      evidence: ["src/lib/permissions/roles.ts", "/team", "/settings"],
      id: "roles-permissions",
      label: "Roles and permissions",
      status: "active",
    },
    {
      area: "core",
      description: "Feature flags control rollouts across clinics, the enterprise shell, and internal tooling.",
      evidence: ["src/lib/platform/config.ts", "/feature-flags"],
      id: "feature-flags",
      label: "Feature flags",
      status: "active",
    },
    {
      area: "commercial",
      description: "Subscription tiers, usage metering, seat logic, and entitlements support commercial packaging.",
      evidence: ["src/lib/billing/*", "/billing", "/subscriptions", "/usage", "/entitlements"],
      id: "billing-abstraction",
      label: "Billing abstraction",
      status: "active",
    },
    {
      area: "commercial",
      description: "Usage and entitlement guards make it possible to sell by clinic, seat, and activity limits.",
      evidence: ["src/lib/billing/quotas.ts", "src/lib/billing/middleware.ts"],
      id: "usage-entitlements",
      label: "Usage and entitlements",
      status: "active",
    },
    {
      area: "security",
      description: "API keys, service role values, and private integration secrets are tracked without exposing the secret values themselves.",
      evidence: ["src/lib/backend/env.ts", "/settings", "/system"],
      id: "api-key-policy",
      label: "API key policy",
      status: "active",
    },
    {
      area: "security",
      description: "Audit logging captures sensitive actions, webhook events, workflow runs, and safety checks.",
      evidence: ["src/lib/security/audit.ts", "/audit"],
      id: "audit-engine",
      label: "Audit engine",
      status: "active",
    },
    {
      area: "marketplace",
      description: "Provider and integration abstractions give each future product a connector-ready surface.",
      evidence: ["src/lib/integrations/registry.ts", "src/lib/platform/providers.ts", "/integrations"],
      id: "integration-marketplace",
      label: "Integration marketplace",
      status: "beta",
    },
    {
      area: "governance",
      description: "The platform health and production readiness surfaces keep go-live blockers visible.",
      evidence: ["src/lib/system/readiness.ts", "/system"],
      id: "production-readiness",
      label: "Production readiness",
      status: "active",
    },
  ];
}

export function buildSaasRoleMatrix(): SaasPermissionSummary[] {
  return clinicRoles.map((role) => ({
    label: roleLabels[role],
    permissionCount: rolePermissions[role].length,
    permissions: rolePermissions[role],
    role,
  }));
}

export function buildSaasBillingTiers(): SaasBillingTier[] {
  return billingPlans.map((plan) => ({
    clinicsIncluded: plan.clinicsIncluded,
    features: [...plan.features],
    key: plan.key,
    name: plan.name,
    priceConfigured: Boolean(process.env[plan.stripePriceEnvKey]),
    priceEnvKey: plan.stripePriceEnvKey,
    usageLimit: accountQuotas[plan.key],
  }));
}

export function buildSaasApiKeySettings(env: BackendEnv = getBackendEnv()): SaasApiKeySetting[] {
  return [
    {
      configured: Boolean(env.supabaseUrl),
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "Supabase URL",
      note: "Public runtime API endpoint for authenticated browser traffic.",
      scope: "browser",
    },
    {
      configured: Boolean(env.supabaseAnonKey),
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      label: "Supabase anon key",
      note: "Public browser session key for Supabase auth and client queries.",
      scope: "browser",
    },
    {
      configured: Boolean(env.supabaseServiceRoleKey),
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "Supabase service role key",
      note: "Server-only key for protected multi-tenant writes and readiness checks.",
      scope: "server",
    },
    {
      configured: Boolean(env.openaiApiKey),
      key: "OPENAI_API_KEY",
      label: "OpenAI API key",
      note: "Server-only key for call summaries, intent analysis, and reception logic.",
      scope: "server",
    },
    {
      configured: Boolean(env.twilioConfigEncryptionSecret),
      key: "TWILIO_CONFIG_ENCRYPTION_SECRET",
      label: "Twilio encryption secret",
      note: "Server-only secret for encrypting the clinic Twilio auth token.",
      scope: "server",
    },
    {
      configured: Boolean(env.twilioAccountSid),
      key: "TWILIO_ACCOUNT_SID",
      label: "Twilio Account SID",
      note: "Twilio account identifier for signature validation and API requests.",
      scope: "server",
    },
    {
      configured: Boolean(env.twilioAuthToken),
      key: "TWILIO_AUTH_TOKEN",
      label: "Twilio auth token fallback",
      note: "Optional fallback when a clinic row is unavailable.",
      scope: "server",
    },
    {
      configured: Boolean(env.twilioPhoneNumber),
      key: "TWILIO_PHONE_NUMBER",
      label: "Twilio phone number",
      note: "The live UK number used for voice and SMS routing.",
      scope: "console",
    },
    {
      configured: Boolean(env.twilioMessagingServiceSid),
      key: "TWILIO_MESSAGING_SERVICE_SID",
      label: "Twilio messaging service SID",
      note: "Optional outbound SMS sender abstraction for recovery flows.",
      scope: "server",
    },
    {
      configured: Boolean(env.stripeSecretKey),
      key: "STRIPE_SECRET_KEY",
      label: "Stripe secret key",
      note: "Billing provider secret for subscription workflows.",
      scope: "server",
    },
  ];
}

export function getSaasPlatformModuleCatalog() {
  return platformConfig.modules;
}

export function getSaasProviderCatalog() {
  return providerRegistry;
}
