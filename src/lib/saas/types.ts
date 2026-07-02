import type { User } from "@supabase/supabase-js";
import type {
  FlowPlatformHealthSnapshot,
  FlowPlatformProfileSummary,
  FlowPlatformProfileValidationSummary,
} from "@/lib/flow-platform";
import type { BillingPlanKey } from "@/lib/billing/plans";
import type { ClinicRole } from "@/lib/permissions/roles";
import type { ProviderDefinition } from "@/lib/integrations/types";
import type { FeatureFlag } from "@/lib/platform/types";
import type { ProductionReadinessReport } from "@/lib/system/readiness";
import type { TenantContext } from "@/lib/tenancy/context";

export type SaasCapabilityStatus = "active" | "beta" | "planned";

export type SaasCapability = {
  area: "core" | "commercial" | "security" | "governance" | "marketplace";
  description: string;
  evidence: readonly string[];
  id: string;
  label: string;
  status: SaasCapabilityStatus;
};

export type SaasApiKeySetting = {
  configured: boolean;
  key: string;
  label: string;
  note: string;
  scope: "browser" | "console" | "server";
};

export type SaasBillingTier = {
  clinicsIncluded: number;
  features: string[];
  key: BillingPlanKey;
  name: string;
  priceConfigured: boolean;
  priceEnvKey: string;
  usageLimit: {
    automations: number;
    clinics: number;
    conversations: number;
    seats: number;
  };
};

export type SaasPermissionSummary = {
  label: string;
  permissionCount: number;
  permissions: string[];
  role: ClinicRole;
};

export type SaasFoundationSnapshot = {
  activeProfile: {
    accent: string;
    id: string;
    industry: string;
    name: string;
    voice: string;
  };
  apiKeys: readonly SaasApiKeySetting[];
  audit: {
    categories: readonly string[];
    sampleRecords: readonly {
      action: string;
      createdAt: string;
      id: string;
      label: string;
      metadata: Record<string, string | number | boolean | null>;
    }[];
  };
  billing: {
    configured: boolean;
    quotas: Record<BillingPlanKey, SaasBillingTier["usageLimit"]>;
    tiers: readonly SaasBillingTier[];
  };
  capabilities: readonly SaasCapability[];
  featureFlags: readonly FeatureFlag[];
  health: FlowPlatformHealthSnapshot;
  integrations: {
    providerCount: number;
    providers: readonly ProviderDefinition[];
  };
  permissions: readonly SaasPermissionSummary[];
  platformModules: readonly {
    area: "core" | "integration" | "automation" | "analytics" | "enterprise";
    description: string;
    id: string;
    name: string;
    status: "active" | "beta" | "planned" | "disabled";
  }[];
  profiles: readonly FlowPlatformProfileSummary[];
  profileValidations: readonly FlowPlatformProfileValidationSummary[];
  readiness: ProductionReadinessReport;
  tenant: {
    current: TenantContext;
    filter: {
      clinic_id: string;
    };
    isolationRules: readonly string[];
    scopeLabel: string;
  };
  user: Pick<User, "email" | "id" | "user_metadata"> | null;
};

export type SaasTenantWorkspace = {
  activeClinicId: string | null;
  branchCount: number;
  featureFlags: readonly string[];
  organisationId: string | null;
  permissions: readonly string[];
  role: ClinicRole | null;
  workspaceId: string | null;
  workspaceName: string;
};

export type SaasMarketplaceProduct = {
  active: boolean;
  activationState: "active" | "available" | "attention";
  dashboardCards: readonly string[];
  description: string;
  entityCount: number;
  id: string;
  industry: string;
  intentCount: number;
  name: string;
  templateCount: number;
  triggerCount: number;
  voice: string;
  workflowCount: number;
};

export type SaasBillingSnapshot = {
  configured: boolean;
  entitlements: readonly {
    enterprise: boolean;
    feature: string;
    growth: boolean;
    starter: boolean;
  }[];
  invoices: readonly {
    amount: string;
    due: string;
    id: string;
    label: string;
    status: string;
  }[];
  planKey: BillingPlanKey;
  planName: string;
  plans: readonly SaasBillingTier[];
  subscriptionStatus: string;
  usage: readonly {
    key: string;
    label: string;
    limit: number;
    used: number;
  }[];
};

export type SaasAiStudioSnapshot = {
  afterHours: string;
  emergency: string;
  faqBehaviour: string;
  greeting: string;
  humanTransfer: string;
  language: string;
  closing: string;
  prompts: readonly {
    key: string;
    title: string;
    prompt: string;
  }[];
  speechRate: string;
  ssmlEnabled: boolean;
  tone: string;
  voice: string;
};

export type SaasIntegrationReadinessProvider = ProviderDefinition & {
  connected: boolean;
  readiness: "ready" | "available" | "planned";
};

export type SaasIntegrationSnapshot = {
  counts: {
    available: number;
    connected: number;
    planned: number;
  };
  providers: readonly SaasIntegrationReadinessProvider[];
  providerCount: number;
  readinessNotes: readonly string[];
};

export type SaasReadinessSnapshot = {
  blockers: readonly string[];
  goLiveReady: boolean;
  readinessScore: number;
  steps: readonly {
    detail: string;
    label: string;
    status: "complete" | "missing" | "error";
    value: string;
  }[];
  urls: {
    health: string;
    sms: string;
    status: string;
    voice: string;
  };
};

export type SaasOnboardingSnapshot = {
  generatedProfileId: string;
  healthScore: number;
  ready: boolean;
  sections: readonly {
    description: string;
    items: readonly {
      label: string;
      value: string;
    }[];
    title: string;
  }[];
};

export type SaasSecuritySnapshot = {
  gdprNotes: readonly string[];
  auditNotes: readonly string[];
  rlsNotes: readonly string[];
  retentionNotes: readonly string[];
  secretChecks: readonly SaasApiKeySetting[];
};

export type SaasCommercialSnapshot = {
  activeProfile: SaasFoundationSnapshot["activeProfile"];
  aiStudio: SaasAiStudioSnapshot;
  audit: SaasFoundationSnapshot["audit"];
  billing: SaasBillingSnapshot;
  foundation: SaasFoundationSnapshot;
  integrations: SaasIntegrationSnapshot;
  marketplace: readonly SaasMarketplaceProduct[];
  onboarding: SaasOnboardingSnapshot;
  readiness: SaasReadinessSnapshot;
  security: SaasSecuritySnapshot;
  tenant: SaasTenantWorkspace;
  workspaceSummary: {
    branchCount: number;
    featureFlagCount: number;
    organisationLabel: string;
    permissionCount: number;
    workspaceCount: number;
  };
};
