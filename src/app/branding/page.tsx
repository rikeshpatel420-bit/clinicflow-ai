import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { platformConfig } from "@/lib/platform/config";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PlatformShell
      active="/branding"
      eyebrow="White-label branding"
      title="Enterprise theming engine"
      description="Tenant branding structure for clinic groups, agencies, custom clinic identity, and future white-label deployments."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {Object.entries(platformConfig.branding).map(([label, value]) => (
          <article key={label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#10201d]">{value}</p>
          </article>
        ))}
      </section>
    </PlatformShell>
  );
}

