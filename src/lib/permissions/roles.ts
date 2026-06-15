export const clinicRoles = ["owner", "admin", "manager", "receptionist", "clinician", "member"] as const;

export type ClinicRole = (typeof clinicRoles)[number];

export type PermissionKey =
  | "clinic.manage"
  | "team.invite"
  | "team.manage_roles"
  | "patients.read"
  | "patients.write"
  | "calls.read"
  | "recovery.manage"
  | "workflows.manage"
  | "analytics.view"
  | "security.manage";

export const roleLabels: Record<ClinicRole, string> = {
  admin: "Admin",
  clinician: "Clinician",
  manager: "Manager",
  member: "Member",
  owner: "Owner",
  receptionist: "Receptionist",
};

export const permissionLabels: Record<PermissionKey, string> = {
  "analytics.view": "View executive analytics",
  "calls.read": "View call activity",
  "clinic.manage": "Manage clinic profile",
  "patients.read": "View patients",
  "patients.write": "Create and edit patients",
  "recovery.manage": "Manage revenue recovery",
  "security.manage": "Manage security settings",
  "team.invite": "Invite team members",
  "team.manage_roles": "Manage team roles",
  "workflows.manage": "Manage automations",
};

export const rolePermissions: Record<ClinicRole, PermissionKey[]> = {
  owner: [
    "clinic.manage",
    "team.invite",
    "team.manage_roles",
    "patients.read",
    "patients.write",
    "calls.read",
    "recovery.manage",
    "workflows.manage",
    "analytics.view",
    "security.manage",
  ],
  admin: [
    "clinic.manage",
    "team.invite",
    "patients.read",
    "patients.write",
    "calls.read",
    "recovery.manage",
    "workflows.manage",
    "analytics.view",
  ],
  manager: [
    "team.invite",
    "patients.read",
    "patients.write",
    "calls.read",
    "recovery.manage",
    "analytics.view",
  ],
  receptionist: ["patients.read", "patients.write", "calls.read", "recovery.manage"],
  clinician: ["patients.read", "patients.write", "calls.read"],
  member: ["patients.read", "calls.read"],
};

export function can(role: ClinicRole, permission: PermissionKey) {
  return rolePermissions[role].includes(permission);
}

