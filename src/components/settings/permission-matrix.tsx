import { clinicRoles, permissionLabels, type PermissionKey } from "@/lib/permissions/roles";
import { can } from "@/lib/permissions/roles";
import { RoleBadge } from "@/components/settings/role-badge";

const permissions = Object.keys(permissionLabels) as PermissionKey[];

export function PermissionMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[840px] text-left text-sm">
        <thead className="bg-[#f7faf9] text-[#65736f]">
          <tr>
            <th className="px-4 py-3 font-semibold">Permission</th>
            {clinicRoles.map((role) => (
              <th key={role} className="px-4 py-3 font-semibold">
                <RoleBadge role={role} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2f0]">
          {permissions.map((permission) => (
            <tr key={permission}>
              <td className="px-4 py-3 font-medium text-[#10201d]">{permissionLabels[permission]}</td>
              {clinicRoles.map((role) => (
                <td key={`${role}-${permission}`} className="px-4 py-3">
                  <span className={`grid size-6 place-items-center rounded-md text-xs font-semibold ${can(role, permission) ? "bg-[#18b7a0] text-[#071311]" : "bg-[#edf2f0] text-[#9aa7a3]"}`}>
                    {can(role, permission) ? "Y" : "-"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

