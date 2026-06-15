import type { TenantRecord } from "@/lib/persistence/tenant-repository";
import { createDemoTenantRepository } from "@/lib/persistence/tenant-repository";

export type CrmPipelineStage = "new_lead" | "contacted" | "consult_booked" | "treatment_presented" | "won" | "lost";

export type CrmPipelineRecord = TenantRecord & {
  patient_name: string;
  stage: CrmPipelineStage;
  value_pence: number;
  probability: number;
  next_action: string;
};

const now = new Date().toISOString();

export const demoCrmPipelineRecords: CrmPipelineRecord[] = [
  {
    id: "crm-1",
    clinic_id: "demo-clinic-harbour",
    created_at: now,
    next_action: "Call back with consultation availability.",
    patient_name: "Demo lead A",
    probability: 72,
    stage: "consult_booked",
    updated_at: now,
    value_pence: 95000,
  },
  {
    id: "crm-2",
    clinic_id: "demo-clinic-harbour",
    created_at: now,
    next_action: "Follow up unscheduled treatment plan.",
    patient_name: "Demo lead B",
    probability: 61,
    stage: "treatment_presented",
    updated_at: now,
    value_pence: 240000,
  },
];

export const crmPipelineRepository = createDemoTenantRepository(demoCrmPipelineRecords);

