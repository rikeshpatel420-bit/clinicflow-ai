import type { ClinicRole } from "./models";

export type TenantScope = {
  clinicId: string;
  role: ClinicRole;
  userId: string;
};

const writeRoles = new Set<ClinicRole>(["owner", "admin", "manager", "receptionist", "clinician"]);
const adminRoles = new Set<ClinicRole>(["owner", "admin"]);

export function canWritePatientData(scope: TenantScope) {
  return writeRoles.has(scope.role);
}

export function canManageBilling(scope: TenantScope) {
  return adminRoles.has(scope.role);
}

export function canManageTeam(scope: TenantScope) {
  return adminRoles.has(scope.role);
}

export function assertTenantMatch(scope: TenantScope, clinicId: string) {
  if (scope.clinicId !== clinicId) {
    throw new Error("Tenant scope mismatch.");
  }
}
