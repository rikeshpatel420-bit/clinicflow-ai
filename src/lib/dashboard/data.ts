import type { User } from "@supabase/supabase-js";
import type { Clinic, Patient, PatientLead, Profile } from "@/types/database";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateDashboardKpis, type DashboardMetric } from "./kpis";

export type CallPlaceholder = {
  id: string;
  clinic_id: string;
  patient_name: string;
  phone: string | null;
  reason: string;
  status: "queued" | "recovered" | "needs_review";
  created_at: string;
};

export type DashboardData = {
  activity: { title: string; meta: string }[];
  calls: CallPlaceholder[];
  clinic: Clinic | null;
  emptyMessage: string | null;
  error: string | null;
  metrics: DashboardMetric[];
  patients: Patient[];
  profile: Profile | null;
  source: "demo" | "supabase";
};

export const demoClinic: Clinic = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Demo Dental Clinic",
  slug: "demo-dental-clinic",
  status: "active",
  timezone: "Europe/London",
  phone: "+44 20 7946 0000",
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
};

export const demoPatients: Patient[] = [
  {
    id: "22222222-2222-4222-8222-222222222221",
    clinic_id: demoClinic.id,
    full_name: "Amelia Carter",
    preferred_name: "Amelia",
    email: "amelia@example.test",
    phone: "+44 7700 900123",
    date_of_birth: null,
    status: "lead",
    source: "phone",
    notes: "Interested in a new consultation.",
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    clinic_id: demoClinic.id,
    full_name: "Noah Patel",
    preferred_name: "Noah",
    email: "noah@example.test",
    phone: "+44 7700 900456",
    date_of_birth: null,
    status: "active",
    source: "manual",
    notes: "Needs a reschedule follow-up.",
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

function buildCallsFromPatients(patients: Patient[]): CallPlaceholder[] {
  return patients
    .filter((patient) => patient.source === "phone")
    .map((patient, index) => ({
      id: `call-placeholder-${patient.id}`,
      clinic_id: patient.clinic_id,
      patient_name: patient.full_name,
      phone: patient.phone,
      reason: patient.notes || "Patient enquiry",
      status: index === 0 ? "queued" : "needs_review",
      created_at: patient.created_at,
    }));
}

function buildActivity(patients: Patient[]) {
  if (patients.length === 0) {
    return [];
  }

  return patients.slice(0, 3).map((patient) => ({
    title: `${patient.full_name} added to patient CRM`,
    meta: patient.source === "phone" ? "Created from phone enquiry placeholder" : "Created manually",
  }));
}

function patientSourceFromLead(source: PatientLead["source"]): Patient["source"] {
  if (source === "website") return "website";
  if (source === "phone" || source === "missed_call") return "phone";
  if (source === "referral") return "referral";
  if (source === "import") return "import";
  return "manual";
}

function patientStatusFromLead(status: PatientLead["status"]): Patient["status"] {
  if (status === "booked" || status === "won") return "active";
  if (status === "archived") return "archived";
  if (status === "lost") return "inactive";
  return "lead";
}

function patientFromLead(lead: PatientLead): Patient {
  const summary = lead.enquiry_summary?.replace(/^\[ClinicFlow demo\]\s*/, "").trim();
  const fallbackName = `${patientSourceFromLead(lead.source)} lead ${lead.id.slice(0, 8)}`;

  return {
    clinic_id: lead.clinic_id,
    created_at: lead.created_at,
    created_by: lead.created_by,
    date_of_birth: null,
    deleted_at: lead.deleted_at,
    email: null,
    full_name: summary?.split(":")[0]?.trim() || fallbackName,
    id: lead.id,
    notes: lead.enquiry_summary,
    phone: null,
    preferred_name: null,
    source: patientSourceFromLead(lead.source),
    status: patientStatusFromLead(lead.status),
    updated_at: lead.updated_at,
    updated_by: lead.updated_by,
  };
}

function buildDashboardData(input: {
  clinic: Clinic | null;
  error?: string | null;
  patients: Patient[];
  profile: Profile | null;
  source: "demo" | "supabase";
}): DashboardData {
  const calls = buildCallsFromPatients(input.patients);

  return {
    activity: buildActivity(input.patients),
    calls,
    clinic: input.clinic,
    emptyMessage: input.clinic ? null : "No clinic workspace found. Complete onboarding to create one.",
    error: input.error ?? null,
    metrics: calculateDashboardKpis({ calls, patients: input.patients }),
    patients: input.patients,
    profile: input.profile,
    source: input.source,
  };
}

export function getDemoDashboardData() {
  return buildDashboardData({
    clinic: demoClinic,
    patients: demoPatients,
    profile: null,
    source: "demo",
  });
}

export async function getDashboardData(user: Pick<User, "email" | "id" | "user_metadata"> | null): Promise<DashboardData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return getDemoDashboardData();
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return buildDashboardData({
      clinic: null,
      patients: [],
      profile: null,
      source: "supabase",
    });
  }

  const [{ data: clinic, error: clinicError }, { data: leads, error: leadsError }] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("patient_leads")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<PatientLead[]>(),
  ]);

  return buildDashboardData({
    clinic: clinic ?? null,
    error: clinicError || leadsError ? "Some dashboard data could not be loaded." : null,
    patients: (leads ?? []).map(patientFromLead),
    profile: null,
    source: "supabase",
  });
}
