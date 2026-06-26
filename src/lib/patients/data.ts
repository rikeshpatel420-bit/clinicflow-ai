import type { User } from "@supabase/supabase-js";
import type { Call, CallTranscript, Clinic, PatientLead, RecoveryWorkflow, SmsEvent, VoicemailMessage } from "@/types/database";
import { parseCallReceptionSummary, type CallReceptionSummary } from "@/lib/ai/call-summary";
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
  notes: string | null;
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

export type PatientTimelineItem = {
  detail: string;
  id: string;
  kind: "call" | "sms" | "voicemail" | "workflow" | "summary" | "note";
  timestamp: string;
  tone: "positive" | "neutral" | "warning";
  title: string;
};

export type PatientDetailData = PatientListData & {
  aiSummary: CallReceptionSummary | null;
  aiSummaryGeneratedAt: string | null;
  callCount: number;
  lead: PatientRecord | null;
  recommendedAction: string;
  smsCount: number;
  summary: {
    appointmentRecommendation: string;
    clinicalNotes: string;
    emailRecommendation: string;
    followUpActions: string[];
    outstandingTasks: string[];
    patientSummary: string;
    reasonForCalling: string;
    receptionNotes: string;
    smsRecommendation: string;
    treatmentRecommendation: string;
    urgencyScore: number;
  };
  timeline: PatientTimelineItem[];
  transcriptCount: number;
  voicemailCount: number;
  workflowCount: number;
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
    notes: lead.enquiry_summary,
    source: leadSourceToPatientSource(lead.source),
    status: leadStatusToPatientStatus(lead.status),
    updated_at: lead.updated_at,
  };
}

function buildPatientDetailData(input: {
  aiSummary: CallReceptionSummary | null;
  aiSummaryGeneratedAt: string | null;
  callCount: number;
  lead: PatientRecord | null;
  listData: PatientListData;
  recommendedAction: string;
  smsCount: number;
  summary: PatientDetailData["summary"];
  timeline: PatientTimelineItem[];
  transcriptCount: number;
  voicemailCount: number;
  workflowCount: number;
}): PatientDetailData {
  return {
    ...input.listData,
    aiSummary: input.aiSummary,
    aiSummaryGeneratedAt: input.aiSummaryGeneratedAt,
    callCount: input.callCount,
    lead: input.lead,
    recommendedAction: input.recommendedAction,
    smsCount: input.smsCount,
    summary: input.summary,
    timeline: input.timeline,
    transcriptCount: input.transcriptCount,
    voicemailCount: input.voicemailCount,
    workflowCount: input.workflowCount,
  };
}

function fallbackPatientSummary(lead: PatientRecord | null, recommendedAction: string): PatientDetailData["summary"] {
  return {
    appointmentRecommendation: "Appointment recommendation will appear once the patient is linked to a live call.",
    clinicalNotes: "Clinical notes will appear once live data is available.",
    emailRecommendation: "Email recommendation will appear once live data is available.",
    followUpActions: ["Review the patient record."],
    outstandingTasks: ["Link a call or recovery workflow."],
    patientSummary: lead?.notes ?? "Patient summary pending.",
    reasonForCalling: lead?.notes ?? "Reason for calling pending.",
    receptionNotes: lead ? recommendedAction : "Reception notes pending.",
    smsRecommendation: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
    treatmentRecommendation: "Reception callback",
    urgencyScore: 0,
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
  const lead = listData.patients.find((item) => item.id === patientId) ?? null;

  if (!lead || listData.source !== "supabase" || !user || !listData.clinic) {
    const recommendedAction = lead ? "Review the patient lead details." : "Create or recover the patient lead first.";

    return buildPatientDetailData({
      aiSummary: null,
      aiSummaryGeneratedAt: null,
      callCount: 0,
      lead,
      listData,
      recommendedAction,
      smsCount: 0,
      summary: fallbackPatientSummary(lead, recommendedAction),
      timeline: [],
      transcriptCount: 0,
      voicemailCount: 0,
      workflowCount: 0,
    });
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return buildPatientDetailData({
      aiSummary: null,
      aiSummaryGeneratedAt: null,
      callCount: 0,
      lead,
      listData,
      recommendedAction: "Create or recover the patient lead first.",
      smsCount: 0,
      summary: fallbackPatientSummary(lead, "Create or recover the patient lead first."),
      timeline: [],
      transcriptCount: 0,
      voicemailCount: 0,
      workflowCount: 0,
    });
  }

  const [{ data: calls }, { data: smsEvents }, { data: workflows }] = await Promise.all([
    supabase
      .from("calls")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("lead_id", patientId)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(20)
      .returns<Call[]>(),
    supabase
      .from("sms_events")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("lead_id", patientId)
      .order("occurred_at", { ascending: false })
      .limit(20)
      .returns<SmsEvent[]>(),
    supabase
      .from("recovery_workflows")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("lead_id", patientId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10)
      .returns<RecoveryWorkflow[]>(),
  ]);

  const relatedCalls = calls ?? [];
  const relatedSms = smsEvents ?? [];
  const relatedWorkflows = workflows ?? [];
  const relatedCallIds = relatedCalls.map((call) => call.id);

  const { data: aiSummaryLog } = await supabase
    .from("ai_audit_logs")
    .select("metadata,created_at")
    .eq("clinic_id", membership.clinic_id)
    .eq("lead_id", lead.id)
    .eq("action", "summary_created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ metadata: unknown; created_at: string }>();

  const aiSummary = parseCallReceptionSummary(aiSummaryLog?.metadata ?? null);

  const [{ data: voicemails }, { data: transcripts }] = await Promise.all([
    relatedCallIds.length
      ? supabase
          .from("voicemail_messages")
          .select("*")
          .eq("clinic_id", membership.clinic_id)
          .is("deleted_at", null)
          .in("call_id", relatedCallIds)
          .order("updated_at", { ascending: false })
          .returns<VoicemailMessage[]>()
      : Promise.resolve({ data: [] as VoicemailMessage[] }),
    relatedCallIds.length
      ? supabase
          .from("call_transcripts")
          .select("*")
          .eq("clinic_id", membership.clinic_id)
          .is("deleted_at", null)
          .in("call_id", relatedCallIds)
          .order("updated_at", { ascending: false })
          .returns<CallTranscript[]>()
      : Promise.resolve({ data: [] as CallTranscript[] }),
  ]);

  const relatedVoicemails = voicemails ?? [];
  const relatedTranscripts = transcripts ?? [];
  const aiSummaryEvent: PatientTimelineItem[] = aiSummary
    ? [
        {
          detail: aiSummary.receptionNotes,
          id: `summary-${aiSummaryLog?.created_at ?? lead.id}`,
          kind: "summary",
          timestamp: aiSummaryLog?.created_at ?? lead.updated_at,
          tone: aiSummary.urgencyScore >= 90 ? "warning" : "positive",
          title: "OpenAI summary",
        },
      ]
    : [];

  const timeline: PatientTimelineItem[] = [
    ...(relatedCalls.map((call): PatientTimelineItem => ({
      detail:
        call.status === "missed"
          ? "Missed call captured and queued for recovery."
          : call.status === "answered"
            ? "Answered call logged with live handling."
            : `Call updated to ${call.status}.`,
      id: `call-${call.id}`,
      kind: "call",
      timestamp: call.updated_at,
      tone: call.status === "missed" || call.status === "abandoned" ? "warning" : "positive",
      title: "Call history",
    })) ?? []),
    ...(relatedSms.map((sms): PatientTimelineItem => ({
      detail: sms.body_preview ?? "SMS event recorded.",
      id: `sms-${sms.id}`,
      kind: "sms",
      timestamp: sms.occurred_at,
      tone: sms.direction === "outbound" && ["sent", "delivered"].includes(sms.status) ? "positive" : sms.direction === "inbound" ? "neutral" : "warning",
      title: sms.direction === "outbound" ? "Outbound SMS" : "Inbound SMS",
    })) ?? []),
    ...(relatedVoicemails.map((voicemail): PatientTimelineItem => ({
      detail: voicemail.summary ?? voicemail.transcript_text ?? "Voicemail received.",
      id: `voicemail-${voicemail.id}`,
      kind: "voicemail",
      timestamp: voicemail.updated_at,
      tone: voicemail.status === "failed" ? "warning" : "neutral",
      title: "Voicemail",
    })) ?? []),
    ...(relatedTranscripts.map((transcript): PatientTimelineItem => ({
      detail: transcript.summary ?? transcript.transcript_text.slice(0, 120),
      id: `transcript-${transcript.id}`,
      kind: "summary",
      timestamp: transcript.updated_at,
      tone: transcript.status === "ready" ? "positive" : "neutral",
      title: "AI summary",
    })) ?? []),
    ...(relatedWorkflows.map((workflow): PatientTimelineItem => ({
      detail: `Recovery workflow moved to ${workflow.state.replace(/_/g, " ")}.`,
      id: `workflow-${workflow.id}`,
      kind: "workflow",
      timestamp: workflow.updated_at,
      tone: workflow.state === "failed" ? "warning" : workflow.state === "recovered" || workflow.state === "booked" ? "positive" : "neutral",
      title: "Recovery workflow",
    })) ?? []),
    ...(lead.notes
      ? [
          {
            detail: lead.notes,
            id: `note-${lead.id}`,
            kind: "note" as const,
            timestamp: lead.updated_at,
            tone: "neutral" as const,
            title: "Reception note",
          },
        ]
      : []),
    ...aiSummaryEvent,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const recommendedAction =
    aiSummary?.followUpRecommendation ??
    (lead.status === "active"
      ? "Confirm the appointment and keep the relationship warm."
      : lead.status === "inactive"
        ? "Respect the opt-out and close the thread."
        : "Follow up with a staff-approved callback or SMS.");

  const summary: PatientDetailData["summary"] = {
    appointmentRecommendation:
      aiSummary?.appointmentRecommendation ??
      (lead.status === "active"
        ? "Confirm the booking and keep the clinic handover calm."
        : "Offer the first clinically appropriate appointment and check diary availability."),
    clinicalNotes:
      aiSummary?.clinicalSummary ??
      (lead.source === "phone"
        ? "Phone enquiry with potential clinical urgency; keep triage clear and concise."
        : "Review the lead notes and decide whether a clinician should be involved."),
    emailRecommendation:
      lead.status === "inactive"
        ? "Send a short follow-up email only if the patient explicitly prefers written communication."
        : "Email confirmation can be used to reinforce the booking or callback.",
    followUpActions: aiSummary
      ? [
          "Confirm the patient prefers call back, SMS, or booking link.",
          aiSummary.followUpRecommendation,
          "Mark the lead outcome once the patient responds.",
        ]
      : [
          "Confirm the patient prefers call back, SMS, or booking link.",
          "Review the diary for the next clinically appropriate slot.",
          "Mark the lead outcome once the patient responds.",
        ],
    outstandingTasks: [
      "Check for any emergency symptoms before routine follow-up.",
      "Route to the right clinician if the treatment requires clinical input.",
    ],
    patientSummary: aiSummary?.patientSummary ?? lead.notes ?? lead.full_name,
    reasonForCalling: lead.notes ?? "Patient lead enquiry summary.",
    receptionNotes: aiSummary?.receptionNotes ?? recommendedActionForLead(lead),
    smsRecommendation: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
    treatmentRecommendation:
      aiSummary?.responseTone === "urgent_callback" || lead.notes?.toLowerCase().includes("emergency") || lead.notes?.toLowerCase().includes("pain")
        ? "Urgent dental assessment"
        : lead.source === "phone"
          ? "Reception callback"
          : "Routine consultation",
    urgencyScore: aiSummary?.urgencyScore ?? (lead.notes?.toLowerCase().includes("emergency") || lead.notes?.toLowerCase().includes("pain") ? 94 : lead.status === "active" ? 78 : 72),
  };

  return buildPatientDetailData({
    aiSummary,
    aiSummaryGeneratedAt: aiSummaryLog?.created_at ?? null,
    callCount: relatedCalls.length,
    lead,
    listData,
    recommendedAction,
    smsCount: relatedSms.length,
    summary,
    timeline,
    transcriptCount: relatedTranscripts.length,
    voicemailCount: relatedVoicemails.length,
    workflowCount: relatedWorkflows.length,
  });
}

function recommendedActionForLead(lead: PatientRecord) {
  if (lead.status === "active") {
    return "Confirm the booking, keep the tone warm, and close the recovery loop.";
  }

  if (lead.status === "inactive") {
    return "Respect the opt-out and close the thread cleanly.";
  }

  if (lead.notes?.toLowerCase().includes("emergency") || lead.notes?.toLowerCase().includes("pain")) {
    return "Treat as urgent and prioritise a same-day callback.";
  }

  return "Use a calm callback or SMS reply to keep the conversation moving.";
}
