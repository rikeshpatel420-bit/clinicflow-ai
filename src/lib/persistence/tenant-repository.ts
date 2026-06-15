import type { TenantContext } from "@/lib/tenancy/context";

export type TenantRecord = {
  id: string;
  clinic_id: string;
  created_at: string;
  updated_at: string;
};

export type TenantRepository<T extends TenantRecord> = {
  list: (tenant: TenantContext) => Promise<T[]>;
  findById: (tenant: TenantContext, id: string) => Promise<T | null>;
};

export function createDemoTenantRepository<T extends TenantRecord>(records: T[]): TenantRepository<T> {
  return {
    async findById(tenant, id) {
      return records.find((record) => record.clinic_id === tenant.clinicId && record.id === id) ?? null;
    },
    async list(tenant) {
      return records.filter((record) => record.clinic_id === tenant.clinicId);
    },
  };
}

