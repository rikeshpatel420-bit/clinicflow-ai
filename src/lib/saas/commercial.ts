import { billingDemo } from "@/lib/billing/data";
import { buildSaasBillingTiers } from "./catalog";
import { buildSaasFoundationSnapshot } from "./foundation";
import { getFlowPlatformProfile, getFlowPlatformProfileSummaries, getFlowPlatformProfileValidationSummaries, type FlowPlatformProfileId } from "@/lib/flow-platform";
import { generateOnboardingPackage, getOnboardingBlueprintDefaults } from "@/lib/onboarding";
import { platformConfig } from "@/lib/platform/config";
import { rolePermissions } from "@/lib/permissions/roles";
import { createAuditRecord } from "@/lib/security/audit";
import { providerRegistry } from "@/lib/integrations/registry";
import type {
  SaasAiStudioSnapshot,
  SaasBillingSnapshot,
  SaasCommercialSnapshot,
  SaasIntegrationReadinessProvider,
  SaasIntegrationSnapshot,
  SaasMarketplaceProduct,
  SaasOnboardingSnapshot,
  SaasReadinessSnapshot,
  SaasSecuritySnapshot,
  SaasTenantWorkspace,
} from "./types";

function buildTenantWorkspace(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasTenantWorkspace {
  const role = foundation.tenant.current.role;
  const permissions = role ? [...rolePermissions[role]] : [];

  return {
    activeClinicId: foundation.readiness.clinic.id,
    branchCount: foundation.readiness.clinic.id ? 1 : 0,
    featureFlags: platformConfig.featureFlags.map((flag) => flag.key),
    organisationId: foundation.readiness.clinic.id,
    permissions,
    role,
    workspaceId: foundation.readiness.clinic.id,
    workspaceName: foundation.readiness.clinic.id ? "Primary workspace" : "Demo workspace",
  };
}

function buildBillingSnapshot(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasBillingSnapshot {
  const plan = billingDemo.subscription.planKey;
  const tiers = buildSaasBillingTiers();

  return {
    configured: foundation.billing.configured,
    entitlements: billingDemo.entitlements,
    invoices: billingDemo.invoices,
    planKey: plan,
    planName: tiers.find((tier) => tier.key === plan)?.name ?? plan,
    plans: tiers,
    subscriptionStatus: billingDemo.subscription.status,
    usage: billingDemo.usage,
  };
}

function buildAiStudioSnapshot(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasAiStudioSnapshot {
  const voiceProfile = foundation.profiles.find((profile) => profile.id === foundation.activeProfile.id);
  const activeProfile = getFlowPlatformProfile(foundation.activeProfile.id as FlowPlatformProfileId);

  return {
    afterHours: activeProfile.conversation.voice.businessHoursPrompt,
    closing: activeProfile.conversation.voice.closing,
    emergency: activeProfile.conversation.voice.emergencyPrompt,
    faqBehaviour: activeProfile.knowledgeBase.safeResponses[0] ?? "Use short, reassuring, profile-safe answers and offer human handoff when uncertain.",
    greeting: activeProfile.conversation.voice.greeting,
    humanTransfer: activeProfile.conversation.voice.fallbackPrompt,
    language: activeProfile.conversation.voice.language,
    prompts: activeProfile.knowledgeBase.prompts.map((prompt) => ({
      key: prompt.key,
      prompt: prompt.prompt,
      title: prompt.title,
    })),
    speechRate: activeProfile.conversation.voice.speechRate,
    ssmlEnabled: activeProfile.conversation.voice.ssmlEnabled,
    tone: activeProfile.conversation.voice.conversationTone,
    voice: voiceProfile?.voice ?? activeProfile.conversation.voice.voice,
  };
}

function buildIntegrationReadiness(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasIntegrationSnapshot {
  const connectedProviders = new Set<string>();
  if (foundation.readiness.twilio.setupHealth?.indicators.connected) {
    connectedProviders.add("twilio");
  }
  if (foundation.billing.configured) {
    connectedProviders.add("stripe");
  }

  const providers: SaasIntegrationReadinessProvider[] = providerRegistry.map((provider) => {
    let readiness: SaasIntegrationReadinessProvider["readiness"] = "available";

    if (provider.key === "twilio") {
      readiness = foundation.readiness.twilio.setupHealth?.indicators.connected ? "ready" : "available";
    } else if (provider.key === "stripe") {
      readiness = foundation.billing.configured ? "ready" : "available";
    } else if (provider.key === "webhooks") {
      readiness = "ready";
    } else if (provider.key === "zapier" || provider.key === "make" || provider.key === "n8n") {
      readiness = "planned";
    }

    return {
      ...provider,
      connected: connectedProviders.has(provider.key),
      readiness,
    };
  });

  const counts = {
    available: providers.filter((provider) => provider.readiness === "available").length,
    connected: providers.filter((provider) => provider.connected).length,
    planned: providers.filter((provider) => provider.readiness === "planned").length,
  };

  return {
    counts,
    providers,
    providerCount: providers.length,
    readinessNotes: [
      "Twilio, Stripe, Google Calendar, Microsoft 365, and email connectors are exposed as reusable interfaces.",
      "Webhook, Zapier, Make, and n8n entries are surfaced as integration placeholders for future automation wiring.",
      "Connector statuses remain profile-aware and never expose secret values.",
    ],
  };
}

function buildMarketplaceProducts(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasMarketplaceProduct[] {
  const profileSummaries = getFlowPlatformProfileSummaries();
  const validations = new Map(getFlowPlatformProfileValidationSummaries().map((validation) => [validation.id, validation]));

  return profileSummaries.map((profile) => {
    const validation = validations.get(profile.id);
    const profileDefinition = getFlowPlatformProfile(profile.id);
    const ready = Boolean(validation?.platformReady);
    const active = profile.id === foundation.activeProfile.id;

    return {
      active,
      activationState: active ? "active" : ready ? "available" : "attention",
      dashboardCards: [profileDefinition.dashboard.labels.activeCalls, profileDefinition.dashboard.labels.followUp, profileDefinition.dashboard.labels.recovery],
      description: profile.description,
      entityCount: profile.entityCount,
      id: profile.id,
      industry: profile.industry,
      intentCount: profile.intentCount,
      name: profile.name,
      templateCount: profile.templateCount,
      triggerCount: profile.triggerCount,
      voice: profile.voice,
      workflowCount: profile.workflowCount,
    };
  });
}

function buildReadinessSnapshot(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasReadinessSnapshot {
  const completeCount = foundation.readiness.steps.filter((step) => step.status === "complete").length;
  const readinessScore = Math.round((completeCount / foundation.readiness.steps.length) * 100);

  return {
    blockers: foundation.readiness.blockers,
    goLiveReady: foundation.readiness.blockers.length === 0,
    readinessScore,
    steps: foundation.readiness.steps.map((step) => ({
      detail: step.detail,
      label: step.label,
      status: step.status,
      value: step.value,
    })),
    urls: foundation.readiness.urls,
  };
}

function buildOnboardingSnapshot(): SaasOnboardingSnapshot {
  const packageSnapshot = generateOnboardingPackage(getOnboardingBlueprintDefaults());

  return {
    generatedProfileId: packageSnapshot.generatedProfile.profileId,
    healthScore: packageSnapshot.platformHealth.score,
    ready: packageSnapshot.platformHealth.ready,
    sections: [
      packageSnapshot.organisationModel,
      packageSnapshot.brandEngine,
      packageSnapshot.promptStudio,
      packageSnapshot.knowledgeBase,
      packageSnapshot.bookingAbstraction,
      packageSnapshot.settingsEngine,
    ].map((section) => ({
      description: section.description,
      items: section.items,
      title: section.title,
    })),
  };
}

function buildSecuritySnapshot(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>): SaasSecuritySnapshot {
  return {
    gdprNotes: [
      "Keep every repository query scoped to the active tenant before it reaches the database.",
      "Avoid exposing auth tokens, service role keys, or row-level security bypass values in the browser.",
      "Document the retention policy for calls, transcripts, notifications, and recovery events before live rollout.",
    ],
    auditNotes: [
      ...foundation.audit.categories.map((category) => `Audit category enabled: ${category}`),
      "Workflow, billing, webhook, and security checks are represented in the shared audit trail.",
    ],
    rlsNotes: [
      "Clinic membership checks must resolve before any patient, call, or workflow mutation.",
      "Service-role access should stay in server-only helpers and readiness checks.",
      "All new data paths should follow the clinic_id isolation model already used by the live app.",
    ],
    retentionNotes: [
      "Call transcripts and AI summaries should be treated as customer history and retained only for the configured policy window.",
      "Notification logs should remain audit-safe and avoid secret-bearing payloads.",
    ],
    secretChecks: foundation.apiKeys,
  };
}

function buildWorkspaceSummary(foundation: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>, tenant: SaasTenantWorkspace) {
  return {
    branchCount: tenant.branchCount,
    featureFlagCount: tenant.featureFlags.length,
    organisationLabel: foundation.readiness.clinic.id ?? "Demo tenant",
    permissionCount: tenant.permissions.length,
    workspaceCount: foundation.readiness.clinic.id ? 1 : 0,
  };
}

export async function buildCommercialSaasSnapshot(input: { baseUrl?: string | null; user: Awaited<ReturnType<typeof buildSaasFoundationSnapshot>>["user"] }): Promise<SaasCommercialSnapshot> {
  const foundation = await buildSaasFoundationSnapshot(input);
  const tenant = buildTenantWorkspace(foundation);
  const billing = buildBillingSnapshot(foundation);
  const marketplace = buildMarketplaceProducts(foundation);
  const readiness = buildReadinessSnapshot(foundation);
  const onboarding = buildOnboardingSnapshot();
  const aiStudio = buildAiStudioSnapshot(foundation);
  const integrations = buildIntegrationReadiness(foundation);
  const security = buildSecuritySnapshot(foundation);
  const workspaceSummary = buildWorkspaceSummary(foundation, tenant);

  return {
    activeProfile: foundation.activeProfile,
    aiStudio,
    audit: {
      ...foundation.audit,
      sampleRecords: [
        ...foundation.audit.sampleRecords,
        {
          ...createAuditRecord({
            action: "security.policy_checked",
            actorId: foundation.user?.id ?? null,
            clinicId: foundation.readiness.clinic.id,
            metadata: {
              readiness: readiness.readinessScore,
              workspaceCount: workspaceSummary.workspaceCount,
            },
          }),
          label: "Commercial readiness review",
        },
      ],
    },
    billing,
    foundation,
    integrations,
    marketplace,
    onboarding,
    readiness,
    security,
    tenant,
    workspaceSummary,
  };
}
