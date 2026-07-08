import type { User } from "@supabase/supabase-js";
import type { Appointment, BookingRequest, Call, CallRecording, CallTranscript, Clinic, PatientLead, RecoveryWorkflow, SmsEvent, VoicemailMessage } from "@/types/database";
import { parseCallReceptionSummary, type CallReceptionSummary } from "@/lib/ai/call-summary";
import { classifyVoiceIntent, extractVoiceCaptureDetails, estimateVoiceUrgency, voiceIntentLabel } from "@/lib/twilio/voice-triage";
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

type LiveTranscriptRow = Pick<CallTranscript, "call_id" | "summary" | "transcript_text" | "source" | "updated_at">;
type LiveAppointmentRow = Pick<Appointment, "appointment_start" | "call_id" | "confirmation_reference" | "id" | "status">;
type LiveBookingRequestRow = Pick<BookingRequest, "call_id" | "confirmation_reference" | "id" | "status">;

type CallLead = Pick<PatientLead, "enquiry_summary" | "estimated_value_pence" | "id" | "priority" | "source" | "status">;

export type CallRecord = LiveCallRow & {
  booked: boolean;
  bookingReference: string | null;
  callerLabel: string;
  estimatedValuePence: number | null;
  intentLabel: string | null;
  leadSummary: string | null;
  outcomeLabel: string;
  recordingLabel: string;
  transcriptPreview: string | null;
  urgencyScore: number | null;
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
  recordings: CallRecording[];
  smsEvents: SmsEvent[];
  transcript: CallTranscript | null;
  voicemail: VoicemailMessage | null;
  workflow: RecoveryWorkflow | null;
};

const now = new Date().toISOString();

export const demoCalls: CallRecord[] = [
  {
    callerLabel: "Amelia Carter",
    booked: false,
    bookingReference: null,
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
    intentLabel: "New patient appointment",
    outcomeLabel: "Recovery queued",
    recordingLabel: "Open call",
    started_at: now,
    status: "missed",
    transcriptPreview: "Caller asked for the next available consultation and left a mobile number.",
    urgencyScore: 68,
    updated_at: now,
  },
  {
    callerLabel: "Noah Patel",
    booked: false,
    bookingReference: null,
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
    intentLabel: "Cancellation or reschedule",
    outcomeLabel: "Answered",
    recordingLabel: "Open call",
    started_at: now,
    status: "answered",
    transcriptPreview: "Patient asked to move an existing appointment to next week.",
    urgencyScore: 56,
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

function transcriptPreviewFromTranscript(transcript?: LiveTranscriptRow | null) {
  const text = transcript?.transcript_text?.trim() || transcript?.summary?.trim() || null;
  if (!text) {
    return null;
  }

  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
}

function enrichCalls(input: {
  appointmentsByCallId: Map<string, LiveAppointmentRow>;
  bookingRequestsByCallId: Map<string, LiveBookingRequestRow>;
  calls: LiveCallRow[];
  leads: CallLead[];
  transcriptsByCallId: Map<string, LiveTranscriptRow>;
}): CallRecord[] {
  const { appointmentsByCallId, bookingRequestsByCallId, calls, leads, transcriptsByCallId } = input;
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));

  return calls.map((call) => {
    const lead = call.lead_id ? leadsById.get(call.lead_id) : undefined;
    const transcript = transcriptsByCallId.get(call.id) ?? null;
    const appointment = appointmentsByCallId.get(call.id) ?? null;
    const bookingRequest = bookingRequestsByCallId.get(call.id) ?? null;
    const transcriptPreview = transcriptPreviewFromTranscript(transcript);
    const sourceText = [lead?.enquiry_summary, transcriptPreview].filter(Boolean).join(" ");
    const intent = classifyVoiceIntent(sourceText);
    const urgencyDetails = extractVoiceCaptureDetails(sourceText);
    const booked = appointment?.status === "confirmed";
    const bookingReference = appointment?.confirmation_reference ?? bookingRequest?.confirmation_reference ?? null;
    return {
      ...call,
      booked,
      bookingReference,
      callerLabel: callerLabel(call, lead),
      estimatedValuePence: lead?.estimated_value_pence ?? null,
      intentLabel: voiceIntentLabel(intent),
      leadSummary: lead?.enquiry_summary ?? null,
      outcomeLabel: booked ? "Appointment booked" : bookingRequest ? "Booking request" : call.recovery_next_action ?? call.recovery_status ?? call.status,
      recordingLabel: "Open call",
      transcriptPreview,
      urgencyScore: estimateVoiceUrgency(intent, urgencyDetails),
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
  const callIds = [...new Set(liveCalls.map((call) => call.id))];
  const transcriptsResult = callIds.length
    ? await supabase
        .from("call_transcripts")
        .select("call_id,summary,transcript_text,source,updated_at")
        .eq("clinic_id", membership.clinic_id)
        .in("call_id", callIds)
        .order("updated_at", { ascending: false })
        .returns<LiveTranscriptRow[]>()
    : { data: [] as LiveTranscriptRow[], error: null };
  const transcriptsByCallId = new Map<string, LiveTranscriptRow>();
  for (const item of transcriptsResult.data ?? []) {
    const key = item.call_id ?? "";
    if (!transcriptsByCallId.has(key)) {
      transcriptsByCallId.set(key, item);
    }
  }
  const appointmentsResult = callIds.length
    ? await supabase
        .from("appointments")
        .select("id,call_id,confirmation_reference,status,appointment_start")
        .eq("clinic_id", membership.clinic_id)
        .in("call_id", callIds)
        .is("deleted_at", null)
        .order("appointment_start", { ascending: false })
        .returns<LiveAppointmentRow[]>()
    : { data: [] as LiveAppointmentRow[], error: null };
  const bookingRequestsResult = callIds.length
    ? await supabase
        .from("booking_requests")
        .select("id,call_id,confirmation_reference,status")
        .eq("clinic_id", membership.clinic_id)
        .in("call_id", callIds)
        .is("deleted_at", null)
        .order("requested_at", { ascending: false })
        .returns<LiveBookingRequestRow[]>()
    : { data: [] as LiveBookingRequestRow[], error: null };
  const appointmentsByCallId = new Map<string, LiveAppointmentRow>();
  for (const appointment of appointmentsResult.data ?? []) {
    if (appointment.call_id && !appointmentsByCallId.has(appointment.call_id)) {
      appointmentsByCallId.set(appointment.call_id, appointment);
    }
  }
  const bookingRequestsByCallId = new Map<string, LiveBookingRequestRow>();
  for (const request of bookingRequestsResult.data ?? []) {
    if (request.call_id && !bookingRequestsByCallId.has(request.call_id)) {
      bookingRequestsByCallId.set(request.call_id, request);
    }
  }

  return buildCallListData({
    canAddDemoCall: ["admin", "owner"].includes(membership.role),
    calls: enrichCalls({
      appointmentsByCallId,
      bookingRequestsByCallId,
      calls: liveCalls,
      leads: leadsResult.data ?? [],
      transcriptsByCallId,
    }),
    clinic: clinic ?? null,
    error: clinicError || callsResult.error || leadsResult.error || appointmentsResult.error || bookingRequestsResult.error ? "Could not load call records." : null,
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
      recordings: [],
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
      recordings: [],
      smsEvents: [],
      transcript: null,
      voicemail: null,
      workflow: null,
    } satisfies CallDetailData;
  }

  const [{ data: lead }, { data: smsEvents }, { data: workflow }, { data: voicemail }, { data: transcript }, { data: recordings }] = await Promise.all([
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
    supabase
      .from("call_recordings")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("call_id", call.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .returns<CallRecording[]>(),
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
    recordings: recordings ?? [],
    smsEvents: smsEvents ?? [],
    transcript: transcript ?? null,
    voicemail: voicemail ?? null,
    workflow: workflow ?? null,
  } satisfies CallDetailData;
}
