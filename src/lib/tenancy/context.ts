export type TenantContext = {
  clinicId: string;
  organisationId: string | null;
  role: "owner" | "admin" | "manager" | "receptionist" | "clinician" | "member";
  source: "supabase" | "demo";
};

export const demoTenantContext: TenantContext = {
  clinicId: "demo-clinic-harbour",
  organisationId: "demo-org-harbour",
  role: "owner",
  source: "demo",
};

export function assertTenantScope<T extends { clinic_id: string }>(record: T, tenant: TenantContext) {
  return record.clinic_id === tenant.clinicId;
}

export function buildTenantFilter(tenant: TenantContext) {
  return { clinic_id: tenant.clinicId };
}

