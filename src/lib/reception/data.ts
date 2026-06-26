import type { User } from "@supabase/supabase-js";
import type {
  Call,
  CallRecording,
  CallTranscript,
  Clinic,
  DashboardMetricSnapshot,
  PatientLead,
  RecoveryWorkflow,
  SmsEvent,
  VoicemailMessage,
} from "@/types/database";
import { demoClinic } from "@/lib/dashboard/data";
import { classifyIntent, scoreLead, type EnquiryCategory } from "@/lib/ai/logic";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LiveClinic = Pick<Clinic, "id" | "name" | "phone" | "status" | "timezone">;

export type ReceptionMetricCard = {
  label: string;
  value: string;
  note: string;
};

export type ReceptionLiveCall = {
  aiConfidence: number;
  appointmentCategory: string;
  callerLabel: string;
  callerNumberLast4: string | null;
  callId: string | null;
  callStatus: Call["status"] | "no-call";
  callTimerLabel: string;
  completedAt: string | null;
  currentSentiment: "calm" | "concerned" | "urgent" | "frustrated";
  emergencyKeywords: string[];
  existingPatientStatus: string;
  hasLiveCall: boolean;
  isNewPatient: boolean;
  leadId: string | null;
  liveTranscription: string;
  nhsLikelihood: number;
  privateLikelihood: number;
  patientIntent: EnquiryCategory;
  recoveryStatus: Call["recovery_status"] | "not_started";
  recordedAt: string;
  suggestedClinician: string;
  suggestedDurationMinutes: number;
  suggestedResponse: string;
  suggestedTreatmentType: string;
};

export type ReceptionSummaryDraft = {
  appointmentRecommendation: string;
  callId: string | null;
  clinicalNotes: string;
  emailRecommendation: string;
  followUpActions: string[];
  leadId: string | null;
  outstandingTasks: string[];
  patientSummary: string;
  reasonForCalling: string;
  receptionNotes: string;
  smsRecommendation: string;
  treatmentRecommendation: string;
  urgencyScore: number;
};

export type ReceptionVoicemailView = {
  callbackRecommendation: string;
  callId: string | null;
  recordingUrl: string | null;
  summary: string;
  transcript: string | null;
  urgency: "low" | "medium" | "high";
  voicemailId: string;
};

export type ReceptionSmsThread = {
  bodyPreview: string;
  id: string;
  lastActivityAt: string;
  patientLabel: string;
  replyState: string;
  statusLabel: string;
  subject: string;
  suggestedReply: string;
  unreadCount: number;
};

export type ReceptionEvent = {
  detail: string;
  id: string;
  label: string;
  timestamp: string;
  tone: "positive" | "neutral" | "warning";
  type: "call" | "sms" | "voicemail" | "workflow";
};

export type ReceptionConsoleData = {
  clinic: LiveClinic | null;
  currentCall: ReceptionLiveCall | null;
  error: string | null;
  lastUpdatedAt: string;
  metrics: ReceptionMetricCard[];
  missedCallEngine: ReceptionMetricCard[];
  recentEvents: ReceptionEvent[];
  smsThreads: ReceptionSmsThread[];
  source: "demo" | "supabase";
  summary: ReceptionSummaryDraft;
  voicemail: ReceptionVoicemailView | null;
};

type LiveSnapshot = {
  activeCalls: Call[];
  calls: Call[];
  clinic: LiveClinic | null;
  recordings: CallRecording[];
  smsEvents: SmsEvent[];
  snapshot: DashboardMetricSnapshot | null;
  transcripts: CallTranscript[];
  voicemails: VoicemailMessage[];
  workflows: RecoveryWorkflow[];
  leads: PatientLead[];
};

const demoNow = new Date().toISOString();

const demoLiveSnapshot: LiveSnapshot = {
  activeCalls: [
    {
      id: "88888888-8888-4888-8888-888888888881",
      clinic_id: demoClinic.id,
      lead_id: "88888888-8888-4888-8888-888888888882",
      direction: "inbound",
      status: "answered",
      caller_number_hash: "demo-live-hash",
      caller_number_last4: "6789",
      clinic_number: demoClinic.phone,
      provider: "twilio",
      provider_call_id: "CA-demo-live",
      started_at: demoNow,
      ended_at: null,
      duration_seconds: 126,
      recovery_status: "sms_sent",
      recovery_next_action: "Waiting for the patient to confirm callback or book online.",
      recovery_updated_at: demoNow,
      created_at: demoNow,
      updated_at: demoNow,
      deleted_at: null,
    },
  ],
  calls: [],
  clinic: demoClinic,
  recordings: [],
  smsEvents: [
    {
      id: "sms-demo-1",
      clinic_id: demoClinic.id,
      lead_id: "88888888-8888-4888-8888-888888888882",
      call_id: "88888888-8888-4888-8888-888888888881",
      recovery_workflow_id: "workflow-demo-1",
      provider: "twilio",
      provider_message_id: "SM-demo-1",
      direction: "outbound",
      status: "delivered",
      from_number_hash: "clinic-demo",
      to_number_hash: "patient-demo",
      to_number_last4: "6789",
      body_preview: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
      error_code: null,
      error_message: null,
      occurred_at: demoNow,
      created_at: demoNow,
    },
  ],
  snapshot: {
    id: "snapshot-demo-1",
    clinic_id: demoClinic.id,
    period_start: demoNow,
    period_end: demoNow,
    missed_calls: 47,
    recovered_calls: 22,
    new_leads: 11,
    booked_leads: 22,
    sms_sent: 44,
    revenue_recovered_pence: 1_425_000,
    calculated_at: demoNow,
    created_at: demoNow,
    updated_at: demoNow,
  },
  transcripts: [
    {
      id: "transcript-demo-1",
      clinic_id: demoClinic.id,
      call_id: "88888888-8888-4888-8888-888888888881",
      recording_id: null,
      provider: "twilio",
      provider_transcript_id: "demo-transcript-1",
      source: "speech",
      transcript_text: "Patient is calling about an emergency toothache and would like a same-day callback.",
      summary: "Emergency toothache enquiry with same-day callback request.",
      confidence: 0.94,
      language_code: "en-GB",
      status: "ready",
      created_at: demoNow,
      updated_at: demoNow,
      deleted_at: null,
    },
  ],
  voicemails: [
    {
      id: "voicemail-demo-1",
      clinic_id: demoClinic.id,
      call_id: "88888888-8888-4888-8888-888888888881",
      recording_id: null,
      provider: "twilio",
      provider_voicemail_id: "VM-demo-1",
      caller_number_hash: "demo-live-hash",
      caller_number_last4: "6789",
      transcript_text: "Please call back today. The patient has severe toothache and needs urgent advice.",
      summary: "Urgent emergency toothache voicemail.",
      status: "transcribed",
      received_at: demoNow,
      created_at: demoNow,
      updated_at: demoNow,
      deleted_at: null,
    },
  ],
  workflows: [
    {
      id: "workflow-demo-1",
      clinic_id: demoClinic.id,
      call_id: "88888888-8888-4888-8888-888888888881",
      lead_id: "88888888-8888-4888-8888-888888888882",
      state: "sms_sent",
      channel: "sms",
      current_step: 2,
      max_steps: 3,
      next_action_at: demoNow,
      assigned_user_id: null,
      last_error: null,
      created_at: demoNow,
      updated_at: demoNow,
      deleted_at: null,
    },
  ],
  leads: [
    {
      id: "88888888-8888-4888-8888-888888888882",
      clinic_id: demoClinic.id,
      source: "missed_call",
      status: "recovered",
      priority: "urgent",
      owner_user_id: null,
      estimated_value_pence: 18000,
      lead_score: 93,
      enquiry_summary: "Emergency toothache enquiry. Needs callback today and a short same-day slot if possible.",
      loss_reason: null,
      gdpr_lawful_basis: "legitimate_interest",
      marketing_consent: false,
      retention_until: null,
      next_follow_up_at: demoNow,
      converted_at: demoNow,
      created_by: null,
      updated_by: null,
      created_at: demoNow,
      updated_at: demoNow,
      deleted_at: null,
    },
  ],
};

function formatClockLabel(value: string | null) {
  if (!value) {
    return "Just now";
  }

  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }

  return `${Math.max(1, minutes)}m ago`;
}

function formatSentence(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  if (!text) {
    return fallback;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function leadToPatientStatus(status: PatientLead["status"]) {
  if (status === "booked" || status === "won" || status === "recovered") return "Active patient";
  if (status === "lost" || status === "opted_out") return "Closed lead";
  if (status === "archived") return "Archived";
  if (status === "contacted") return "Contacted lead";
  if (status === "qualified") return "Qualified lead";
  return "New lead";
}

function countKeywords(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword)).length;
}

function buildNhsPrivateLikelihood(text: string) {
  const privateSignals = countKeywords(text, ["implant", "invisalign", "whitening", "smile", "private", "bonding"]);
  const nhsSignals = countKeywords(text, ["nhs", "emergency", "toothache", "pain", "swelling", "broken", "urgent"]);
  const privateScore = Math.min(92, 40 + privateSignals * 14 + (text.length > 120 ? 8 : 0));
  const nhsScore = Math.min(92, 38 + nhsSignals * 13 + (text.includes("today") ? 4 : 0));
  const total = Math.max(privateScore + nhsScore, 100);

  return {
    nhs: Math.round((nhsScore / total) * 100),
    private: Math.round((privateScore / total) * 100),
  };
}

function buildSentiment(text: string): ReceptionLiveCall["currentSentiment"] {
  const lower = text.toLowerCase();
  if (lower.includes("urgent") || lower.includes("emergency") || lower.includes("pain") || lower.includes("swelling")) return "urgent";
  if (lower.includes("frustrated") || lower.includes("complaint")) return "frustrated";
  if (lower.includes("please") || lower.includes("thanks") || lower.includes("help")) return "concerned";
  return "calm";
}

function buildIntentDetails(text: string) {
  const intent = classifyIntent(text);
  const score = scoreLead(intent, 18, 180);
  const keywords = ["pain", "swelling", "emergency", "implant", "invisalign", "hygiene", "whitening"].filter((keyword) =>
    text.toLowerCase().includes(keyword),
  );

  return {
    appointmentCategory:
      intent === "emergency"
        ? "Urgent triage"
        : intent === "implant_consult"
          ? "Implant consultation"
          : intent === "hygiene_recall"
            ? "Reactivation / hygiene"
            : intent === "reschedule"
              ? "Reschedule request"
              : intent === "price_question"
                ? "Pricing enquiry"
                : intent === "new_patient"
                  ? "New patient onboarding"
                  : "General administration",
    emergencyKeywords: keywords,
    intent,
    score,
  };
}

function summariseLeadAction(lead: PatientLead | null, call: Call | null) {
  if (!lead && !call) {
    return "Create a summary when the first call lands.";
  }

  if (lead?.status === "booked" || call?.recovery_status === "booked") {
    return "Confirm the booking, then hand over to reception for the clinical schedule.";
  }

  if (lead?.status === "recovered" || call?.recovery_status === "recovered") {
    return "Call back, acknowledge the request, and lock the next step in the diary.";
  }

  if (lead?.status === "opted_out" || call?.recovery_status === "lost") {
    return "Respect the opt-out and close the recovery thread cleanly.";
  }

  if (lead?.next_follow_up_at) {
    return `Follow up ${formatClockLabel(lead.next_follow_up_at)}.`;
  }

  return "Send a calm callback and keep the thread moving.";
}

function buildLiveCall(
  call: Call | null,
  lead: PatientLead | null,
  transcript: CallTranscript | null,
  voicemail: VoicemailMessage | null,
): ReceptionLiveCall | null {
  if (!call && !lead) {
    return null;
  }

  const sourceText = [lead?.enquiry_summary, transcript?.summary, transcript?.transcript_text, voicemail?.summary, voicemail?.transcript_text]
    .filter(Boolean)
    .join(" ");
  const intentDetails = buildIntentDetails(sourceText || "Patient call");
  const sentiment = buildSentiment(sourceText || "Patient call");
  const likelihood = buildNhsPrivateLikelihood(sourceText || "Patient call");
  const summaryLabel = sourceText.split(/[.:]/)[0]?.trim() ?? "";
  const callerLabel = summaryLabel || (call?.caller_number_last4 ? `Caller ending ${call.caller_number_last4}` : lead?.id ? `Lead ${lead.id.slice(0, 8)}` : "Incoming caller");
  const startedAt = call?.started_at ?? lead?.created_at ?? demoNow;

  return {
    aiConfidence: Math.min(99, Math.max(72, intentDetails.score + (lead?.lead_score ? Math.floor(lead.lead_score / 4) : 0))),
    appointmentCategory: intentDetails.appointmentCategory,
    callerLabel,
    callerNumberLast4: call?.caller_number_last4 ?? null,
    callId: call?.id ?? null,
    callStatus: call?.status ?? "no-call",
    callTimerLabel: formatClockLabel(startedAt),
    completedAt: call?.ended_at ?? voicemail?.created_at ?? transcript?.created_at ?? null,
    currentSentiment: sentiment,
    emergencyKeywords: intentDetails.emergencyKeywords,
    existingPatientStatus: lead ? leadToPatientStatus(lead.status) : "New patient",
    hasLiveCall: Boolean(call && call.status === "answered" && !call.ended_at),
    isNewPatient: !lead || lead.status === "new" || lead.source === "missed_call",
    leadId: lead?.id ?? null,
    liveTranscription:
      transcript?.transcript_text?.trim() ||
      voicemail?.transcript_text?.trim() ||
      lead?.enquiry_summary?.trim() ||
      "Awaiting live transcription...",
    nhsLikelihood: likelihood.nhs,
    privateLikelihood: likelihood.private,
    patientIntent: intentDetails.intent,
    recoveryStatus: call?.recovery_status ?? "not_started",
    recordedAt: call?.updated_at ?? lead?.updated_at ?? demoNow,
    suggestedClinician:
      intentDetails.intent === "emergency"
        ? "Senior dentist on duty"
        : intentDetails.intent === "implant_consult"
          ? "Implant lead clinician"
          : intentDetails.intent === "hygiene_recall"
            ? "Hygiene team"
            : "Reception team",
    suggestedDurationMinutes: intentDetails.intent === "emergency" ? 10 : intentDetails.intent === "implant_consult" ? 30 : 20,
    suggestedResponse:
      intentDetails.intent === "emergency"
        ? "Thank the caller, confirm symptoms, and move to same-day clinical triage."
        : "Acknowledge the enquiry, offer the next available slot, and confirm the callback window.",
    suggestedTreatmentType:
      intentDetails.intent === "implant_consult"
        ? "Implant consultation"
        : intentDetails.intent === "hygiene_recall"
          ? "Hygiene review"
          : intentDetails.intent === "emergency"
            ? "Urgent assessment"
            : "Reception callback",
  };
}

function buildSummaryDraft(call: Call | null, lead: PatientLead | null, liveCall: ReceptionLiveCall | null): ReceptionSummaryDraft {
  const baseSummary = liveCall?.liveTranscription ?? lead?.enquiry_summary ?? "AI summary pending.";

  return {
    appointmentRecommendation:
      liveCall?.patientIntent === "emergency"
        ? "Offer same-day callback and a reserved urgent assessment slot."
        : "Offer the first appropriate appointment and confirm the preferred callback window.",
    callId: call?.id ?? null,
    clinicalNotes: formatSentence(
      liveCall?.patientIntent === "emergency"
        ? "Emergency symptoms should be escalated to a clinician before routine admin follow-up."
        : "Review the call for appointment fit, consent, and urgency before handing over.",
      "Clinical notes pending.",
    ),
    emailRecommendation:
      liveCall?.patientIntent === "implant_consult"
        ? "Send a short follow-up email with consultation availability and next-step options."
        : "Use email only if the patient prefers a written follow-up and the clinic has consent.",
    followUpActions: [
      liveCall?.patientIntent === "emergency" ? "Call back within 10 minutes." : "Send staff-approved SMS follow-up.",
      "Check the diary for the next clinically appropriate slot.",
      "Log any safeguarding or urgent escalation notes.",
    ],
    leadId: lead?.id ?? null,
    outstandingTasks: [
      "Confirm the right clinician or hygienist.",
      "Record the response outcome in the recovery workflow.",
      "Mark the lead as booked, recovered, or opted out once complete.",
    ],
    patientSummary: formatSentence(baseSummary, "Patient summary pending."),
    reasonForCalling: formatSentence(
      lead?.enquiry_summary ?? liveCall?.liveTranscription ?? "Missed call recovery enquiry.",
      "Reason for calling pending.",
    ),
    receptionNotes: formatSentence(
      summariseLeadAction(lead, call),
      "Reception notes pending.",
    ),
    smsRecommendation: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
    treatmentRecommendation:
      liveCall?.patientIntent === "implant_consult"
        ? "Implant consultation"
        : liveCall?.patientIntent === "hygiene_recall"
          ? "Hygiene reactivation"
          : liveCall?.patientIntent === "emergency"
            ? "Urgent dental assessment"
            : "Reception callback",
    urgencyScore: liveCall?.patientIntent === "emergency" ? 96 : lead?.lead_score ?? 74,
  };
}

function buildVoicemailView(call: Call | null, voicemail: VoicemailMessage | null, transcript: CallTranscript | null): ReceptionVoicemailView | null {
  if (!voicemail && !transcript) {
    return null;
  }

  const text = transcript?.summary ?? voicemail?.summary ?? transcript?.transcript_text ?? voicemail?.transcript_text ?? "";
  const urgency = text.toLowerCase().includes("urgent") || text.toLowerCase().includes("emergency") ? "high" : text ? "medium" : "low";

  return {
    callbackRecommendation:
      urgency === "high"
        ? "Call back immediately and prioritise clinician triage."
        : "Call back before the end of the day and confirm the next step.",
    callId: call?.id ?? voicemail?.call_id ?? transcript?.call_id ?? null,
    recordingUrl: voicemail?.recording_id ? `Recording ${voicemail.recording_id}` : null,
    summary: text || "Voicemail captured and ready for transcription.",
    transcript: transcript?.transcript_text ?? voicemail?.transcript_text ?? null,
    urgency,
    voicemailId: voicemail?.id ?? transcript?.id ?? "voice-note",
  };
}

function buildSmsThreads(events: SmsEvent[], leads: PatientLead[]): ReceptionSmsThread[] {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const grouped = new Map<string, SmsEvent[]>();

  for (const event of events) {
    const key = event.recovery_workflow_id ?? event.call_id ?? event.lead_id ?? event.to_number_hash ?? event.from_number_hash ?? event.id;
    const list = grouped.get(key) ?? [];
    list.push(event);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries())
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
      const latest = sorted[sorted.length - 1];
      const lead = latest.lead_id ? leadById.get(latest.lead_id) ?? null : null;
      const hasReply = sorted.some((item) => item.direction === "inbound");
      const subject = lead?.enquiry_summary?.split(".")[0]?.trim() || (latest.direction === "outbound" ? "Recovery SMS sent" : "Patient reply received");

      return {
        bodyPreview: latest.body_preview ?? "SMS thread",
        id: key,
        lastActivityAt: latest.occurred_at,
        patientLabel: lead?.enquiry_summary?.split(":")[0]?.trim() || `Thread ${key.slice(0, 8)}`,
        replyState: hasReply ? "replied" : latest.direction === "outbound" ? "awaiting reply" : "queued",
        statusLabel: latest.status.replace(/_/g, " "),
        subject,
        suggestedReply:
          latest.direction === "outbound"
            ? "Wait for a YES reply, then call back and book if appropriate."
            : "Reply with a calm, staff-approved next step and offer a callback window.",
        unreadCount: hasReply ? 0 : 1,
      };
    })
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
    .slice(0, 8);
}

function buildEvents(calls: Call[], smsEvents: SmsEvent[], voicemails: VoicemailMessage[], workflows: RecoveryWorkflow[]) {
  const events: ReceptionEvent[] = [];

  for (const call of calls.slice(0, 6)) {
    events.push({
      detail: call.status === "missed" ? "Missed call queued for recovery." : call.status === "answered" ? "Call answered and captured." : formatSentence(call.recovery_next_action, "Call updated."),
      id: `call-${call.id}`,
      label: call.status === "missed" ? "Missed call" : call.status === "answered" ? "Answered call" : "Call update",
      timestamp: call.updated_at,
      tone: call.status === "missed" || call.status === "abandoned" ? "warning" : "positive",
      type: "call",
    });
  }

  for (const event of smsEvents.slice(0, 6)) {
    events.push({
      detail: formatSentence(event.body_preview, "SMS event recorded."),
      id: `sms-${event.id}`,
      label: event.direction === "outbound" ? "SMS sent" : "SMS reply",
      timestamp: event.occurred_at,
      tone: event.direction === "outbound" && ["sent", "delivered"].includes(event.status) ? "positive" : event.direction === "inbound" ? "neutral" : "warning",
      type: "sms",
    });
  }

  for (const voicemail of voicemails.slice(0, 4)) {
    events.push({
      detail: formatSentence(voicemail.summary ?? voicemail.transcript_text, "Voicemail captured."),
      id: `voicemail-${voicemail.id}`,
      label: "Voicemail",
      timestamp: voicemail.updated_at,
      tone: voicemail.status === "failed" ? "warning" : "neutral",
      type: "voicemail",
    });
  }

  for (const workflow of workflows.slice(0, 4)) {
    events.push({
      detail: `Workflow moved to ${workflow.state.replace(/_/g, " ")}.`,
      id: `workflow-${workflow.id}`,
      label: "Recovery workflow",
      timestamp: workflow.updated_at,
      tone: workflow.state === "failed" ? "warning" : workflow.state === "booked" || workflow.state === "recovered" ? "positive" : "neutral",
      type: "workflow",
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
}

function buildMetrics(snapshot: DashboardMetricSnapshot | null, input: LiveSnapshot): ReceptionMetricCard[] {
  const totalCalls = input.calls.length;
  const missedCalls = input.calls.filter((call) => ["missed", "voicemail", "abandoned"].includes(call.status)).length;
  const answeredCalls = input.calls.filter((call) => call.status === "answered").length;
  const bookedLeads = input.leads.filter((lead) => lead.status === "booked" || lead.status === "won").length;
  const recoveredLeads = input.leads.filter((lead) => lead.status === "recovered").length;
  const smsSent = input.smsEvents.filter((event) => event.direction === "outbound" && ["queued", "sent", "delivered"].includes(event.status)).length;
  const voicemails = input.voicemails.length;
  const aiHandled = input.calls.filter((call) => ["missed", "answered", "voicemail", "recovered", "abandoned"].includes(call.status)).length;
  const responseRate = missedCalls > 0 ? Math.round((recoveredLeads / missedCalls) * 100) : 0;
  const revenueRecoveredPence =
    snapshot?.revenue_recovered_pence ??
    input.leads.filter((lead) => lead.status === "booked" || lead.status === "won").reduce((total, lead) => total + lead.estimated_value_pence, 0);
  const averageResponseMinutes = input.smsEvents.length
    ? Math.max(
        3,
        Math.round(
          input.smsEvents
            .filter((event) => event.direction === "outbound")
            .reduce((total, event) => total + (event.status === "sent" ? 6 : 4), 0) / Math.max(1, smsSent),
        ),
      )
    : 8;
  const patientSatisfaction = Math.min(99, Math.max(84, responseRate > 0 ? 88 + Math.min(8, responseRate / 10) : 86));

  return [
    { label: "Daily calls", value: totalCalls.toLocaleString("en-GB"), note: snapshot ? `Period ending ${snapshot.period_end}` : "Live call volume" },
    { label: "Answered", value: answeredCalls.toLocaleString("en-GB"), note: "Real-time answer handling" },
    { label: "Missed", value: missedCalls.toLocaleString("en-GB"), note: "Queued for recovery" },
    { label: "Booked", value: bookedLeads.toLocaleString("en-GB"), note: "Recovered to diary" },
    { label: "Revenue recovered", value: `£${(revenueRecoveredPence / 100).toLocaleString("en-GB")}`, note: "Tracked from booked leads" },
    { label: "SMS sent", value: smsSent.toLocaleString("en-GB"), note: "Recovery messages delivered" },
    { label: "Voicemails", value: voicemails.toLocaleString("en-GB"), note: "Stored with transcripts" },
    { label: "AI handled", value: aiHandled.toLocaleString("en-GB"), note: `${patientSatisfaction}% satisfaction signal` },
    { label: "Response time", value: `${averageResponseMinutes}m`, note: `${responseRate}% recovery rate` },
  ];
}

function buildMissedCallEngine(input: LiveSnapshot): ReceptionMetricCard[] {
  const missedCalls = input.calls.filter((call) => ["missed", "voicemail", "abandoned"].includes(call.status)).length;
  const smsSent = input.smsEvents.filter((event) => event.direction === "outbound" && ["sent", "delivered"].includes(event.status)).length;
  const replies = input.smsEvents.filter((event) => event.direction === "inbound").length;
  const recovered = input.leads.filter((lead) => lead.status === "recovered" || lead.status === "booked" || lead.status === "won").length;
  const recoveryRate = missedCalls > 0 ? Math.round((recovered / missedCalls) * 100) : 0;

  return [
    { label: "Missed calls", value: missedCalls.toString(), note: "Ready for SMS recovery" },
    { label: "SMS replied", value: replies.toString(), note: "Patient replies logged" },
    { label: "Recovered leads", value: recovered.toString(), note: "Converted back to the diary" },
    { label: "Recovery %", value: `${recoveryRate}%`, note: "Measured against missed calls" },
    { label: "SMS sent", value: smsSent.toString(), note: "Outbound recovery messages" },
  ];
}

function buildSnapshot(input: LiveSnapshot, source: "demo" | "supabase" = "supabase"): ReceptionConsoleData {
  const latestCall = input.activeCalls[0] ?? input.calls[0] ?? null;
  const relatedLead = latestCall?.lead_id ? input.leads.find((lead) => lead.id === latestCall.lead_id) ?? null : null;
  const relatedTranscript = latestCall ? input.transcripts.find((item) => item.call_id === latestCall.id) ?? null : null;
  const relatedVoicemail = latestCall ? input.voicemails.find((item) => item.call_id === latestCall.id) ?? null : input.voicemails[0] ?? null;
  const liveCall = buildLiveCall(latestCall, relatedLead, relatedTranscript, relatedVoicemail);
  const summary = buildSummaryDraft(latestCall, relatedLead, liveCall);

  return {
    clinic: input.clinic,
    currentCall: liveCall,
    error: null,
    lastUpdatedAt: new Date().toISOString(),
    metrics: buildMetrics(input.snapshot, input),
    missedCallEngine: buildMissedCallEngine(input),
    recentEvents: buildEvents(input.calls, input.smsEvents, input.voicemails, input.workflows),
    smsThreads: buildSmsThreads(input.smsEvents, input.leads),
    source,
    summary,
    voicemail: buildVoicemailView(latestCall, relatedVoicemail, relatedTranscript),
  };
}

function emptySnapshot(error: string): ReceptionConsoleData {
  return {
    clinic: null,
    currentCall: null,
    error,
    lastUpdatedAt: new Date().toISOString(),
    metrics: [],
    missedCallEngine: [],
    recentEvents: [],
    smsThreads: [],
    source: "demo",
    summary: {
      appointmentRecommendation: "Load clinic data to generate a live appointment recommendation.",
      callId: null,
      clinicalNotes: "Clinical notes will appear here once a call is captured.",
      emailRecommendation: "Email recommendation will appear here after the first call.",
      followUpActions: ["Connect the clinic to Supabase.", "Load demo or live activity."],
      leadId: null,
      outstandingTasks: ["Capture a missed call."],
      patientSummary: "Awaiting the first live patient interaction.",
      reasonForCalling: "Awaiting the first live patient interaction.",
      receptionNotes: "Awaiting the first live patient interaction.",
      smsRecommendation: "Hi, thanks for calling ClinicFlow Dental. Sorry we missed you. Reply YES and we'll call you back.",
      treatmentRecommendation: "Reception callback",
      urgencyScore: 0,
    },
    voicemail: null,
  };
}

export async function getReceptionConsoleData(user: Pick<User, "email" | "id" | "user_metadata"> | null): Promise<ReceptionConsoleData> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return buildSnapshot(demoLiveSnapshot);
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    return emptySnapshot("No active clinic membership found.");
  }

  const [
    { data: clinic },
    { data: snapshot },
    { data: calls },
    { data: leads },
    { data: smsEvents },
    { data: workflows },
    { data: voicemails },
    { data: transcripts },
    { data: recordings },
  ] = await Promise.all([
    supabase.from("clinics").select("id,name,phone,status,timezone").eq("id", membership.clinic_id).maybeSingle<LiveClinic>(),
    supabase
      .from("dashboard_metric_snapshots")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle<DashboardMetricSnapshot>(),
    supabase
      .from("calls")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<Call[]>(),
    supabase
      .from("patient_leads")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<PatientLead[]>(),
    supabase
      .from("sms_events")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .order("occurred_at", { ascending: false })
      .limit(30)
      .returns<SmsEvent[]>(),
    supabase
      .from("recovery_workflows")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<RecoveryWorkflow[]>(),
    supabase
      .from("voicemail_messages")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(12)
      .returns<VoicemailMessage[]>(),
    supabase
      .from("call_transcripts")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<CallTranscript[]>(),
    supabase
      .from("call_recordings")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20)
      .returns<CallRecording[]>(),
  ]);

  const liveSnapshot: LiveSnapshot = {
    activeCalls: (calls ?? []).filter((call) => call.status === "answered" && !call.ended_at).slice(0, 1),
    calls: calls ?? [],
    clinic: clinic ?? null,
    recordings: recordings ?? [],
    smsEvents: smsEvents ?? [],
    snapshot: snapshot ?? null,
    transcripts: transcripts ?? [],
    voicemails: voicemails ?? [],
    workflows: workflows ?? [],
    leads: leads ?? [],
  };

  const data = buildSnapshot(liveSnapshot, "supabase");

  return {
    ...data,
    clinic: clinic ?? data.clinic,
    error: null,
    source: "supabase",
  };
}

export function getDemoReceptionConsoleData() {
  return buildSnapshot(demoLiveSnapshot, "demo");
}
