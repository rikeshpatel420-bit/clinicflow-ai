import type { Clinic, ClinicMember, Patient } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PatientFilters = {
  query?: string;
  status?: Patient["status"] | "all";
};

export type PatientListData = {
  clinic: Clinic | null;
  emptyMessage: string | null;
  error: string | null;
  filters: Required<PatientFilters>;
  patients: Patient[];
  source: "demo" | "supabase";
};

function normalizeFilters(filters: PatientFilters): Required<PatientFilters> {
  return {
    query: filters.query?.trim() ?? "",
    status: filters.status ?? "all",
  };
}

function applyLocalFilters(patients: Patient[], filters: Required<PatientFilters>) {
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
  patients: Patient[];
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

export function getDemoPatientListData(filters: PatientFilters = {}) {
  const normalizedFilters = normalizeFilters(filters);

  return buildPatientListData({
    clinic: demoClinic,
    filters: normalizedFilters,
    patients: applyLocalFilters(demoPatients, normalizedFilters),
    source: "demo",
  });
}

export async function getPatientListData(userId: string | null, filters: PatientFilters = {}) {
  const normalizedFilters = normalizeFilters(filters);
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !userId) {
    return getDemoPatientListData(normalizedFilters);
  }

  const supabase = await createSupabaseServerClient();
  const { data: membership, error: membershipError } = await supabase
    .from("clinic_members")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ClinicMember>();

  if (membershipError) {
    return buildPatientListData({
      clinic: null,
      error: "Could not load clinic membership.",
      filters: normalizedFilters,
      patients: [],
      source: "supabase",
    });
  }

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
      .from("patients")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<Patient[]>(),
  ]);

  const filteredPatients = applyLocalFilters(patientsResult.data ?? [], normalizedFilters);

  return buildPatientListData({
    clinic: clinic ?? null,
    error: clinicError || patientsResult.error ? "Could not load patient records." : null,
    filters: normalizedFilters,
    patients: filteredPatients,
    source: "supabase",
  });
}

export async function getPatientDetailData(userId: string | null, patientId: string) {
  const listData = await getPatientListData(userId);
  const patient = listData.patients.find((item) => item.id === patientId) ?? null;

  return {
    ...listData,
    patient,
  };
}
