import type { ClinicRole } from "@/lib/permissions/roles";
import { roleLabels } from "@/lib/permissions/roles";

const roleTone: Record<ClinicRole, string> = {
  admin: "bg-[#e8f8f4] text-[#087968]",
  clinician: "bg-[#eef4f2] text-[#394642]",
  manager: "bg-[#ecfdf5] text-[#047857]",
  member: "bg-[#f7faf9] text-[#65736f]",
  owner: "bg-[#10201d] text-white",
  receptionist: "bg-[#fff7ed] text-[#9a3412]",
};

export function RoleBadge({ role }: { role: ClinicRole }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${roleTone[role]}`}>{roleLabels[role]}</span>;
}

