import { redirect } from "next/navigation";
import { FeatureFlagList } from "@/components/platform/feature-flag-list";
import { PlatformShell } from "@/components/platform/platform-shell";
import { platformConfig } from "@/lib/platform/config";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PlatformShell
      active="/feature-flags"
      eyebrow="Feature flag system"
      title="Controlled rollout management"
      description="Demo feature flag registry for clinic, enterprise, internal, and global rollout controls."
    >
      <FeatureFlagList flags={platformConfig.featureFlags} />
    </PlatformShell>
  );
}

