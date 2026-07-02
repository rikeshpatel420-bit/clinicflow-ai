import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/enterprise/enterprise-shell";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getClinicSettingsSnapshot } from "@/lib/settings/store";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OrganisationPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");
  const membership = user ? await getActiveClinicMembershipForUser(user) : null;
  const snapshot = membership ? await getClinicSettingsSnapshot(membership.clinic_id) : null;
  const config = snapshot?.clinic.business_configuration;

  return (
    <EnterpriseShell
      active="/organisation"
      eyebrow="Organisation management"
      title="Clinic hierarchy and master controls"
      description="The organisation view now reflects the saved clinic profile, branch list, and identity details used across the app."
    >
      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["Organisation", config?.businessProfile.businessName ?? "Unconfigured"],
          ["Primary branch", config?.businessProfile.activeBranch ?? "Unconfigured"],
          ["Timezone", config?.businessProfile.timezone ?? "Europe/London"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#10201d]">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Saved business profile</p>
          <div className="mt-4 grid gap-3 text-sm">
            {[
              ["Owner", config?.businessProfile.ownerName ?? "Unconfigured"],
              ["Owner email", config?.businessProfile.ownerEmail ?? "Unconfigured"],
              ["Business email", config?.businessProfile.businessEmail ?? "Unconfigured"],
              ["Business phone", config?.businessProfile.businessPhone ?? "Unconfigured"],
              ["Website", config?.businessProfile.businessWebsite ?? "Unconfigured"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-[#edf2f0] bg-[#fbfdfc] px-4 py-3">
                <span className="font-medium text-[#52615d]">{label}</span>
                <span className="font-semibold text-[#10201d]">{value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#087968]">Branch list</p>
          <div className="mt-4 grid gap-3">
            {(config?.branches ?? []).map((branch) => (
              <div key={`${branch.name}-${branch.phone}`} className="rounded-xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="font-semibold text-[#10201d]">{branch.name}</p>
                <p className="mt-1 text-sm leading-6 text-[#65736f]">{branch.address}</p>
                <p className="mt-1 text-sm text-[#65736f]">{branch.phone}</p>
                <p className="mt-1 text-xs text-[#7b8a85]">{branch.notes}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </EnterpriseShell>
  );
}

