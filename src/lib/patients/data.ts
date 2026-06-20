import type { User } from "@supabase/supabase-js";
import type { Clinic, PatientLead } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PatientRecord = {
  id: string;
  clinic_id: string;
  created_at: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  preferred_name: string | null;
  source: "manual" | "website" | "phone" | "referral" | "import";
  status: "active" | "lead" | "inactive" | "archived";
  updated_at: string;
};

export type PatientFilters = {
  query?: string;
  status?: PatientRecord["status"] | "all";
};

export type PatientListData = {
  clinic: Clinic | null;
  emptyMessage: string | null;
  error: string | null;
  filters: Required<PatientFilters>;
  patients: PatientRecord[];
  source: "demo" | "supabase";
};

function normalizeFilters(filters: PatientFilters): Required<PatientFilters> {
  return {
    query: filters.query?.trim() ?? "",
    status: filters.status ?? "all",
  };
}

function applyLocalFilters(patients: PatientRecord[], filters: Required<PatientFilters>) {
  return patients.filter((patient) => {
    const matchesQuery =
      !filters.query ||
      patient.full_name.toLowerCase().includes(filters.query.toLowerCase()) ||
      patient.email?.toLowerCase().includes(filters.query.toLowerCase()) ||
      patient.phone?.includes(filters.query);
    const matchesStatus = filters.status === "all" || patient.status === filters.status;

    return matchesQuery && matchesStatus;
  });
}

function buildPatientListData(input: {
  clinic: Clinic | null;
  error?: string | null;
  filters: Required<PatientFilters>;
  patients: PatientRecord[];
  source: "demo" | "supabase";
}): PatientListData {
  return {
    clinic: input.clinic,
    emptyMessage: input.clinic ? null : "No clinic workspace found. Create a clinic before adding patients.",
    error: input.error ?? null,
    filters: input.filters,
    patients: input.patients,
    source: input.source,
  };
}

function leadStatusToPatientStatus(status: PatientLead["status"]): PatientRecord["status"] {
  if (status === "booked" || status === "won" || status === "recovered") return "active";
  if (status === "lost" || status === "opted_out") return "inactive";
  if (status === "archived") return "archived";
  return "lead";
}

function leadSourceToPatientSource(source: PatientLead["source"]): PatientRecord["source"] {
  if (source === "missed_call") return "phone";
  if (source === "campaign") return "manual";
  return source;
}

function leadName(lead: PatientLead) {
  const summary = lead.enquiry_summary?.replace(/^\[ClinicFlow demo\]\s*/i, "").trim();
  if (!summary) return `Lead ${lead.id.slice(0, 8)}`;

  const beforeColon = summary.split(":")[0]?.trim();
  return beforeColon && beforeColon.length <= 80 ? beforeColon : summary.slice(0, 80);
}

function leadPreferredName(fullName: string) {
  const first = fullName.split(/\s+/)[0];
  return first && !/^lead$/i.test(first) ? first : null;
}

function leadToPatientRecord(lead: PatientLead): PatientRecord {
  const fullName = leadName(lead);

  return {
    clinic_id: lead.clinic_id,
    created_at: lead.created_at,
    email: null,
    full_name: fullName,
    id: lead.id,
    phone: null,
    preferred_name: leadPreferredName(fullName),
    source: leadSourceToPatientSource(lead.source),
    status: leadStatusToPatientStatus(lead.status),
    updated_at: lead.updated_at,
  };
}

export function getDemoPatientListData(filters: PatientFilters = {}) {
  const normalizedFilters = normalizeFilters(filters);

  return buildPatientListData({
    clinic: demoClinic,
    filters: normalizedFilters,
    patients: applyLocalFilters(demoPatients, normalizedFilters),
    source: "demo",
  });
}

export async function getPatientListData(user: Pick<User, "email" | "id" | "user_metadata"> | null, filters: PatientFilters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return getDemoPatientListData(normalizedFilters);
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return buildPatientListData({
      clinic: null,
      filters: normalizedFilters,
      patients: [],
      source: "supabase",
    });
  }

  const [{ data: clinic, error: clinicError }, patientsResult] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("patient_leads")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<PatientLead[]>(),
  ]);

  const patientRecords = (patientsResult.data ?? []).map(leadToPatientRecord);
  const filteredPatients = applyLocalFilters(patientRecords, normalizedFilters);

  return buildPatientListData({
    clinic: clinic ?? null,
    error: clinicError || patientsResult.error ? "Could not load patient records." : null,
    filters: normalizedFilters,
    patients: filteredPatients,
    source: "supabase",
  });
}

export async function getPatientDetailData(user: Pick<User, "email" | "id" | "user_metadata"> | null, patientId: string) {
  const listData = await getPatientListData(user);
  const patient = listData.patients.find((item) => item.id === patientId) ?? null;

  return {
    ...listData,
    patient,
  };
}
