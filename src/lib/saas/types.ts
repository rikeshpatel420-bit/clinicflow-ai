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
