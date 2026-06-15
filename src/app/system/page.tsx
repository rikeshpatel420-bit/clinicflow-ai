import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { platformConfig } from "@/lib/platform/config";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PlatformShell
      active="/system"
      eyebrow="System status"
      title="Health and uptime center"
      description="Demo health center for system status, uptime visibility, test-mode services, and operational confidence."
    >
      <section className="grid gap-4 md:grid-cols-2">
        {platformConfig.health.map((item) => (
          <article key={item.service} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[#10201d]">{item.service}</h2>
              <span className="rounded-md bg-[#e8f8f4] px-2.5 py-1 text-xs font-semibold text-[#087968]">{item.status}</span>
            </div>
            <p className="mt-3 text-sm text-[#65736f]">{item.uptime}</p>
          </article>
        ))}
      </section>
    </PlatformShell>
  );
}

