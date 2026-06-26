import type { User } from "@supabase/supabase-js";
import type { Call, CallTranscript, Clinic, PatientLead, RecoveryWorkflow, SmsEvent, VoicemailMessage } from "@/types/database";
import { parseCallReceptionSummary, type CallReceptionSummary } from "@/lib/ai/call-summary";
import { demoClinic } from "@/lib/dashboard/data";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LiveCallRow = Pick<
  Call,
  | "id"
  | "clinic_id"
  | "lead_id"
  | "direction"
  | "status"
  | "caller_number_hash"
  | "caller_number_last4"
  | "clinic_number"
  | "provider"
  | "provider_call_id"
  | "started_at"
  | "ended_at"
  | "duration_seconds"
  | "recovery_status"
  | "recovery_next_action"
  | "recovery_updated_at"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

type CallLead = Pick<PatientLead, "enquiry_summary" | "estimated_value_pence" | "id" | "priority" | "source" | "status">;

export type CallRecord = LiveCallRow & {
  callerLabel: string;
  estimatedValuePence: number | null;
  leadSummary: string | null;
};

export type CallListData = {
  canAddDemoCall: boolean;
  calls: CallRecord[];
  clinic: Clinic | null;
  emptyMessage: string | null;
  error: string | null;
  source: "demo" | "supabase";
};

export type CallDetailData = CallListData & {
  call: CallRecord | null;
  aiSummary: CallReceptionSummary | null;
  aiSummaryGeneratedAt: string | null;
  lead: CallLead | null;
  recommendedAction: string;
  smsEvents: SmsEvent[];
  transcript: CallTranscript | null;
  voicemail: VoicemailMessage | null;
  workflow: RecoveryWorkflow | null;
};

const now = new Date().toISOString();

export const demoCalls: CallRecord[] = [
  {
    callerLabel: "Amelia Carter",
    caller_number_hash: null,
    caller_number_last4: "0123",
    clinic_id: demoClinic.id,
    clinic_number: demoClinic.phone,
    created_at: now,
    deleted_at: null,
    direction: "inbound",
    duration_seconds: null,
    ended_at: null,
    estimatedValuePence: 35000,
    id: "33333333-3333-4333-8333-333333333331",
    lead_id: null,
    leadSummary: "Missed new consultation enquiry.",
    provider: "manual",
    provider_call_id: null,
    recovery_next_action: "Draft recovery SMS for staff review.",
    recovery_status: "queued",
    recovery_updated_at: now,
    started_at: now,
    status: "missed",
    updated_at: now,
  },
  {
    callerLabel: "Noah Patel",
    caller_number_hash: null,
    caller_number_last4: "0456",
    clinic_id: demoClinic.id,
    clinic_number: demoClinic.phone,
    created_at: now,
    deleted_at: null,
    direction: "inbound",
    duration_seconds: 184,
    ended_at: now,
    estimatedValuePence: null,
    id: "33333333-3333-4333-8333-333333333332",
    lead_id: null,
    leadSummary: "Patient called about rescheduling.",
    provider: "manual",
    provider_call_id: null,
    recovery_next_action: "No recovery needed.",
    recovery_status: "closed",
    recovery_updated_at: now,
    started_at: now,
    status: "answered",
    updated_at: now,
  },
];

function buildCallListData(input: {
  canAddDemoCall?: boolean;
  calls: CallRecord[];
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

function callerLabel(call: LiveCallRow, lead?: CallLead) {
  const summaryName = lead?.enquiry_summary?.split(":")[0]?.trim();
  if (summaryName && summaryName.length <= 80) return summaryName;
  if (call.caller_number_last4) return `Caller ending ${call.caller_number_last4}`;
  return "Unknown caller";
}

function enrichCalls(calls: LiveCallRow[], leads: CallLead[]): CallRecord[] {
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));

  return calls.map((call) => {
    const lead = call.lead_id ? leadsById.get(call.lead_id) : undefined;
    return {
      ...call,
      callerLabel: callerLabel(call, lead),
      estimatedValuePence: lead?.estimated_value_pence ?? null,
      leadSummary: lead?.enquiry_summary ?? null,
    };
  });
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

  if (!isSupabaseConfigured || !user) return getDemoCallListData();

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return buildCallListData({ canAddDemoCall: false, calls: [], clinic: null, source: "supabase" });
  }

  const [{ data: clinic, error: clinicError }, callsResult] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("calls")
      .select(
        "id,clinic_id,lead_id,direction,status,caller_number_hash,caller_number_last4,clinic_number,provider,provider_call_id,started_at,ended_at,duration_seconds,recovery_status,recovery_next_action,recovery_updated_at,created_at,updated_at,deleted_at",
      )
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(25)
      .returns<LiveCallRow[]>(),
  ]);

  const liveCalls = callsResult.data ?? [];
  const leadIds = [...new Set(liveCalls.map((call) => call.lead_id).filter((id): id is string => Boolean(id)))];
  const leadsResult = leadIds.length
    ? await supabase
        .from("patient_leads")
        .select("id,enquiry_summary,estimated_value_pence")
        .eq("clinic_id", membership.clinic_id)
        .in("id", leadIds)
        .returns<CallLead[]>()
    : { data: [] as CallLead[], error: null };

  return buildCallListData({
    canAddDemoCall: ["admin", "owner"].includes(membership.role),
    calls: enrichCalls(liveCalls, leadsResult.data ?? []),
    clinic: clinic ?? null,
    error: clinicError || callsResult.error || leadsResult.error ? "Could not load call records." : null,
    source: "supabase",
  });
}

export async function getCallDetailData(user: Pick<User, "email" | "id" | "user_metadata"> | null, callId: string) {
  const listData = await getCallListData(user);
  const call = listData.calls.find((item) => item.id === callId) ?? null;

  if (!call || listData.source !== "supabase" || !user || !listData.clinic) {
    return {
      ...listData,
      call,
      aiSummary: null,
      aiSummaryGeneratedAt: null,
      lead: null,
      recommendedAction: call ? "Review the call log and recovery notes." : "No call found.",
      smsEvents: [],
      transcript: null,
      voicemail: null,
      workflow: null,
    } satisfies CallDetailData;
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return {
      ...listData,
      call,
      aiSummary: null,
      aiSummaryGeneratedAt: null,
      lead: null,
      recommendedAction: "Review the call log and recovery notes.",
      smsEvents: [],
      transcript: null,
      voicemail: null,
      workflow: null,
    } satisfies CallDetailData;
  }

  const [{ data: lead }, { data: smsEvents }, { data: workflow }, { data: voicemail }, { data: transcript }] = await Promise.all([
    call.lead_id
      ? supabase.from("patient_leads").select("id,enquiry_summary,estimated_value_pence,status,source,priority").eq("clinic_id", membership.clinic_id).eq("id", call.lead_id).maybeSingle<CallLead>()
      : Promise.resolve({ data: null as CallLead | null }),
    supabase
      .from("sms_events")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("call_id", call.id)
      .order("occurred_at", { ascending: true })
      .returns<SmsEvent[]>(),
    supabase
      .from("recovery_workflows")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("call_id", call.id)
      .maybeSingle<RecoveryWorkflow>(),
    supabase
      .from("voicemail_messages")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("call_id", call.id)
      .maybeSingle<VoicemailMessage>(),
    supabase
      .from("call_transcripts")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("call_id", call.id)
      .maybeSingle<CallTranscript>(),
  ]);

  const { data: aiSummaryLog } = await supabase
    .from("ai_audit_logs")
    .select("metadata,created_at")
    .eq("clinic_id", membership.clinic_id)
    .eq("call_id", call.id)
    .eq("action", "summary_created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ metadata: unknown; created_at: string }>();

  const aiSummary = parseCallReceptionSummary(aiSummaryLog?.metadata ?? null);

  return {
    ...listData,
    call,
    aiSummary,
    aiSummaryGeneratedAt: aiSummaryLog?.created_at ?? null,
    lead: lead ?? null,
    recommendedAction:
      call.status === "missed"
        ? "Send or confirm the recovery SMS and wait for the reply."
        : call.status === "voicemail"
          ? "Review the voicemail transcript and call back promptly."
          : call.status === "answered"
            ? "Confirm the outcome and capture the next booking step."
            : "Review the call and decide the next recovery step.",
    smsEvents: smsEvents ?? [],
    transcript: transcript ?? null,
    voicemail: voicemail ?? null,
    workflow: workflow ?? null,
  } satisfies CallDetailData;
}
