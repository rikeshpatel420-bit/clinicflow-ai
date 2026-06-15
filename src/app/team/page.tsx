import { redirect } from "next/navigation";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import { RoleBadge } from "@/components/settings/role-badge";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsShell } from "@/components/settings/settings-shell";
import { enterpriseSettingsDemo } from "@/lib/settings/data";
import { roleLabels } from "@/lib/permissions/roles";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <SettingsShell
      active="/team"
      eyebrow="Team management"
      title="Roles, invitations, and permissions"
      description="Demo architecture for scaling from one clinic owner to multi-location teams with clear role boundaries."
    >
      <section className="grid gap-6">
        <SettingsCard title="Team members" description="Clinic-scoped user management prepared for Supabase memberships and RLS.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-[#f7faf9] text-[#65736f]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f0]">
                {enterpriseSettingsDemo.team.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#10201d]">{member.name}</p>
                      <p className="mt-1 text-[#65736f]">{member.email}</p>
                    </td>
                    <td className="px-4 py-4"><RoleBadge role={member.role} /></td>
                    <td className="px-4 py-4 text-[#394642]">{member.location}</td>
                    <td className="px-4 py-4 text-[#087968]">{member.status}</td>
                    <td className="px-4 py-4 text-[#65736f]">{member.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsCard>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <SettingsCard title="Invitation architecture" description="No real emails are sent yet. This models pending invites and future acceptance flows.">
            <div className="grid gap-3">
              {enterpriseSettingsDemo.invitations.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                  <p className="font-semibold text-[#10201d]">{invite.email}</p>
                  <p className="mt-1 text-sm text-[#65736f]">
                    {roleLabels[invite.role]} role, invited by {invite.invitedBy}, expires in {invite.expiresIn}
                  </p>
                </div>
              ))}
              <button type="button" className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white">
                Invite team member
              </button>
            </div>
          </SettingsCard>

          <SettingsCard title="Permission matrix" description="Role-based access foundation for owners, admins, staff, and enterprise governance.">
            <PermissionMatrix />
          </SettingsCard>
        </section>
      </section>
    </SettingsShell>
  );
}

