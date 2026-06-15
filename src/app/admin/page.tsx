import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { providerAdapters } from "@/lib/platform/providers";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PlatformShell
      active="/admin"
      eyebrow="Internal admin tooling"
      title="Master admin controls"
      description="Demo-safe internal admin view for providers, tenant readiness, safe mode, and future support workflows."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {providerAdapters.map((provider) => (
          <article key={provider.id} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{provider.capability}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{provider.name}</h2>
            <p className="mt-3 text-sm text-[#65736f]">Enabled {provider.enabled ? "yes" : "no"} / Safe mode {provider.safeMode ? "on" : "off"}</p>
          </article>
        ))}
      </section>
    </PlatformShell>
  );
}

