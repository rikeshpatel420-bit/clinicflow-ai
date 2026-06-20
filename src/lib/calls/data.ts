import type { User } from "@supabase/supabase-js";
import type { Call, Clinic } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CallListData = {
  canAddDemoCall: boolean;
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
    lead_id: null,
    patient_id: demoPatients[0]?.id ?? null,
    direction: "inbound",
    status: "missed",
    caller_number_hash: null,
    caller_number_last4: "0123",
    caller_number: "+44 7700 900123",
    clinic_number: demoClinic.phone,
    provider: "manual",
    provider_call_id: null,
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
    lead_id: null,
    patient_id: demoPatients[1]?.id ?? null,
    direction: "inbound",
    status: "answered",
    caller_number_hash: null,
    caller_number_last4: "0456",
    caller_number: "+44 7700 900456",
    clinic_number: demoClinic.phone,
    provider: "manual",
    provider_call_id: null,
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
  canAddDemoCall?: boolean;
  calls: Call[];
  clinic: Clinic | null;
  error?: string | null;
  source: "demo" | "supabase";
}): CallListData {
  return {
    canAddDemoCall: input.canAddDemoCall ?? false,
    calls: input.calls,
    clinic: input.clinic,
    emptyMessage: input.clinic ? null : "No clinic workspace found. Create a clinic before reviewing calls.",
    error: input.error ?? null,
    source: input.source,
  };
}

export function getDemoCallListData() {
  return buildCallListData({
    canAddDemoCall: false,
    calls: demoCalls,
    clinic: demoClinic,
    source: "demo",
  });
}

export async function getCallListData(user: Pick<User, "email" | "id" | "user_metadata"> | null): Promise<CallListData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return getDemoCallListData();
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return buildCallListData({
      canAddDemoCall: false,
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
    canAddDemoCall: ["admin", "owner"].includes(membership.role),
    calls: callsResult.data ?? [],
    clinic: clinic ?? null,
    error: clinicError || callsResult.error ? "Could not load call records." : null,
    source: "supabase",
  });
}

export async function getCallDetailData(user: Pick<User, "email" | "id" | "user_metadata"> | null, callId: string) {
  const listData = await getCallListData(user);
  const call = listData.calls.find((item) => item.id === callId) ?? null;

  return {
    ...listData,
    call,
  };
}
