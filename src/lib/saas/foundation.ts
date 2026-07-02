import type { User } from "@supabase/supabase-js";
import { getActiveFlowPlatformProfile, getFlowPlatformHealthSnapshot, getFlowPlatformProfileSummaries, getFlowPlatformProfileValidationSummaries } from "@/lib/flow-platform";
import { createAuditRecord } from "@/lib/security/audit";
import { buildProductionReadinessReport } from "@/lib/system/readiness";
import { buildTenantFilter, demoTenantContext, type TenantContext } from "@/lib/tenancy/context";
import { getBackendEnv } from "@/lib/backend/env";
import { platformConfig } from "@/lib/platform/config";
import { buildSaasApiKeySettings, buildSaasBillingTiers, buildSaasCapabilityCatalog, buildSaasRoleMatrix, getSaasPlatformModuleCatalog, getSaasProviderCatalog } from "./catalog";
import type { SaasFoundationSnapshot } from "./types";

function currentTenantFromReadiness(readiness: Awaited<ReturnType<typeof buildProductionReadinessReport>>) {
  if (!readiness.clinic.id) {
    return demoTenantContext;
  }

  return {
    clinicId: readiness.clinic.id,
    organisationId: readiness.clinic.id,
    role: readiness.clinic.role ?? demoTenantContext.role,
    source: "supabase" as const,
  } satisfies TenantContext;
}

export async function buildSaasFoundationSnapshot(input: {
  baseUrl?: string | null;
  user: Pick<User, "email" | "id" | "user_metadata"> | null;
}): Promise<SaasFoundationSnapshot> {
  const env = getBackendEnv();
  const activeProfile = getActiveFlowPlatformProfile();
  const profiles = getFlowPlatformProfileSummaries();
  const profileValidations = getFlowPlatformProfileValidationSummaries();
  const health = getFlowPlatformHealthSnapshot();
  const readiness = await buildProductionReadinessReport({
    baseUrl: input.baseUrl,
    user: input.user,
  });
  const tenant = currentTenantFromReadiness(readiness);
  const billingTiers = buildSaasBillingTiers();
  const apiKeys = buildSaasApiKeySettings(env);
  const capabilities = buildSaasCapabilityCatalog();
  const permissions = buildSaasRoleMatrix();
  const providers = getSaasProviderCatalog();
  const platformModules = getSaasPlatformModuleCatalog();

  return {
    activeProfile: {
      accent: activeProfile.clinic.branding.accent,
      id: activeProfile.id,
      industry: activeProfile.industry.name,
      name: activeProfile.clinic.name,
      voice: activeProfile.conversation.voice.voice,
    },
    apiKeys,
    audit: {
      categories: ["tenant.access_checked", "billing.plan_viewed", "webhook.event_received", "security.policy_checked"],
      sampleRecords: [
        {
          ...createAuditRecord({
          action: "tenant.access_checked",
          actorId: input.user?.id ?? null,
          clinicId: readiness.clinic.id,
          metadata: {
            scope: tenant.role,
            source: tenant.source,
            workspace: tenant.clinicId,
          },
          }),
          label: "Tenant access check",
        },
        {
          ...createAuditRecord({
          action: "billing.plan_viewed",
          actorId: input.user?.id ?? null,
          clinicId: readiness.clinic.id,
          metadata: {
            configured: billingTiers.some((tier) => tier.priceConfigured),
            tiers: billingTiers.length,
          },
          }),
          label: "Billing plan view",
        },
        {
          ...createAuditRecord({
          action: "security.policy_checked",
          actorId: input.user?.id ?? null,
          clinicId: readiness.clinic.id,
          metadata: {
            apiKeys: apiKeys.filter((key) => key.configured).length,
            blockers: readiness.blockers.length,
          },
          }),
          label: "Security policy check",
        },
      ],
    },
    billing: {
      configured: Boolean(env.stripeSecretKey && env.stripeWebhookSecret),
      quotas: {
        enterprise: billingTiers.find((tier) => tier.key === "enterprise")?.usageLimit ?? {
          automations: 0,
          clinics: 0,
          conversations: 0,
          seats: 0,
        },
        growth: billingTiers.find((tier) => tier.key === "growth")?.usageLimit ?? {
          automations: 0,
          clinics: 0,
          conversations: 0,
          seats: 0,
        },
        starter: billingTiers.find((tier) => tier.key === "starter")?.usageLimit ?? {
          automations: 0,
          clinics: 0,
          conversations: 0,
          seats: 0,
        },
      },
      tiers: billingTiers,
    },
    capabilities,
    featureFlags: platformConfig.featureFlags,
    health,
    integrations: {
      providerCount: providers.length,
      providers,
    },
    permissions,
    platformModules,
    profiles,
    profileValidations,
    readiness,
    tenant: {
      current: tenant,
      filter: buildTenantFilter(tenant),
      isolationRules: [
        "Always scope data by clinic_id before reading or writing records.",
        "Keep service-role access in server-only helpers and readiness checks.",
        "Apply role permissions before team, billing, or security changes.",
        "Treat feature flags, billing, and audit records as workspace-specific data.",
      ],
      scopeLabel: readiness.clinic.id ? `${readiness.clinic.role ?? "member"} / ${readiness.clinic.id}` : "No clinic membership",
    },
    user: input.user,
  };
}
