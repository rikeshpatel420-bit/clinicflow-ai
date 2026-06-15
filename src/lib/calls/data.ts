import type { Call, Clinic, ClinicMember } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CallListData = {
  calls: Call[];
  clinic: Clinic | null;
  emptyMessage: string | null;
  error: string | null;
  source: "demo" | "supabase";
};

const now = new Date().toISOString();

export const demoCalls: Call[] = [
  {
    id: "33333333-3333-4333-8333-333333333331",
    clinic_id: demoClinic.id,
    patient_id: demoPatients[0]?.id ?? null,
    direction: "inbound",
    status: "missed",
    caller_number: "+44 7700 900123",
    clinic_number: demoClinic.phone,
    started_at: now,
    ended_at: null,
    duration_seconds: null,
    summary: "Missed new consultation enquiry.",
    recovery_status: "queued",
    recovery_next_action: "Draft recovery SMS for staff review.",
    recovery_updated_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
  {
    id: "33333333-3333-4333-8333-333333333332",
    clinic_id: demoClinic.id,
    patient_id: demoPatients[1]?.id ?? null,
    direction: "inbound",
    status: "answered",
    caller_number: "+44 7700 900456",
    clinic_number: demoClinic.phone,
    started_at: now,
    ended_at: now,
    duration_seconds: 184,
    summary: "Patient called about rescheduling.",
    recovery_status: "closed",
    recovery_next_action: "No recovery needed.",
    recovery_updated_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  },
];

function buildCallListData(input: {
  calls: Call[];
  clinic: Clinic | null;
  error?: string | null;
  source: "demo" | "supabase";
}): CallListData {
  return {
    calls: input.calls,
    clinic: input.clinic,
    emptyMessage: input.clinic ? null : "No clinic workspace found. Create a clinic before reviewing calls.",
    error: input.error ?? null,
    source: input.source,
  };
}

export function getDemoCallListData() {
  return buildCallListData({
    calls: demoCalls,
    clinic: demoClinic,
    source: "demo",
  });
}

export async function getCallListData(userId: string | null): Promise<CallListData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !userId) {
    return getDemoCallListData();
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
    return buildCallListData({
      calls: [],
      clinic: null,
      error: "Could not load clinic membership.",
      source: "supabase",
    });
  }

  if (!membership) {
    return buildCallListData({
      calls: [],
      clinic: null,
      source: "supabase",
    });
  }

  const [{ data: clinic, error: clinicError }, callsResult] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("calls")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(25)
      .returns<Call[]>(),
  ]);

  return buildCallListData({
    calls: callsResult.data ?? [],
    clinic: clinic ?? null,
    error: clinicError || callsResult.error ? "Could not load call records." : null,
    source: "supabase",
  });
}

export async function getCallDetailData(userId: string | null, callId: string) {
  const listData = await getCallListData(userId);
  const call = listData.calls.find((item) => item.id === callId) ?? null;

  return {
    ...listData,
    call,
  };
}
