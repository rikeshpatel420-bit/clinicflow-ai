import { redirect } from "next/navigation";
import { ActivityList } from "@/components/settings/activity-list";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import { roleLabels } from "@/lib/permissions/roles";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <SettingsShell
      active="/account"
      eyebrow="Account management"
      title="Owner profile and activity history"
      description="Demo account controls for identity, role context, notification ownership, and audit visibility."
    >
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <SettingsCard title="Profile" description="Prepared for Supabase profile records and multi-clinic membership switching.">
          <div className="grid gap-3 text-sm">
            {[
              ["Name", enterpriseSettingsDemo.account.name],
              ["Email", enterpriseSettingsDemo.account.email],
              ["Current role", roleLabels[enterpriseSettingsDemo.account.role]],
              ["Security posture", enterpriseSettingsDemo.account.securityPosture],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <span className="font-medium text-[#65736f]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Activity history" description="Owner-facing audit trail foundation for sensitive account and clinic actions.">
          <ActivityList items={enterpriseSettingsDemo.activity} />
        </SettingsCard>
      </section>
    </SettingsShell>
  );
}

