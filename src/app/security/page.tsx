import { redirect } from "next/navigation";
import { ActivityList } from "@/components/settings/activity-list";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <SettingsShell
      active="/security"
      eyebrow="Security center"
      title="Access, audit, and governance"
      description="Enterprise-grade security UX foundation for role controls, audit trails, sessions, and future compliance workflows."
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SettingsCard title="Security settings" description="Demo-only policies ready to map to real account and clinic controls later.">
          <div className="grid gap-3">
            {enterpriseSettingsDemo.security.map((item) => (
              <div key={item.label} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="font-semibold text-[#10201d]">{item.label}</p>
                <p className="mt-1 text-sm text-[#65736f]">{item.value}</p>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Audit trail foundation" description="Tracks permission, invitation, security, and automation governance events.">
          <ActivityList items={enterpriseSettingsDemo.activity} />
        </SettingsCard>
      </section>
    </SettingsShell>
  );
}

