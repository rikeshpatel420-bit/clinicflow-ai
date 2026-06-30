import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Call, CallTranscript, Clinic, Inserts, Patient, PatientLead, RecoveryWorkflow, SmsEvent, TwilioConnection, VoicemailMessage } from "@/types/database";
import { generateCallReceptionSummary } from "@/lib/ai/call-summary";
import { hashPhoneNumber, normalizePhoneNumber } from "./crypto";
import { getTwilioConnectionForVoiceNumber, toTwilioConnectionView } from "./config";
import { classifyTwilioCall, type TwilioWebhookPayload } from "./missed-call";
import { createRecoverySmsDraft, sendRecoverySms } from "./sms";

function getShortId(value: string) {
  return value.slice(0, 8);
}

function buildLeadSummary(input: {
  callSid: string;
  callerNumber: string | null;
  clinicNumber: string | null;
  note: string;
}) {
  const caller = input.callerNumber ?? "unknown number";
  const clinicNumber = input.clinicNumber ? `Clinic number: ${input.clinicNumber}.` : "";

  return [
    `Missed call from ${caller}.`,
    input.note,
    `Call SID: ${input.callSid}.`,
    clinicNumber,
  ]
    .filter(Boolean)
    .join(" ");
}

function logTwilioError(event: string, error: unknown, details: Record<string, unknown> = {}) {
  console.error("[ClinicFlow Twilio]", event, JSON.stringify({ ...details, error: error instanceof Error ? error.message : String(error) }));
}

async function findTwilioConnectionForPayload(payload: TwilioWebhookPayload) {
  const lookupNumber = normalizePhoneNumber(payload.To || payload.Called);
  if (!lookupNumber) {
    return { connection: null, error: "Missing Twilio destination number." };
  }

  return getTwilioConnectionForVoiceNumber(lookupNumber);
}

async function getClinicName(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("clinics").select("name").eq("id", clinicId).maybeSingle<Pick<Clinic, "name">>();

  if (error || !data) {
    return null;
  }

  return data.name;
}

function buildPatientDisplayName(callerNumber: string | null, leadSummary: string | null) {
  const summary = leadSummary?.replace(/^\[ClinicFlow demo\]\s*/i, "").trim();
  const candidate = summary?.split(":")[0]?.trim();

  if (candidate && !/(call|enquiry|callback|missed|phone|emergency)/i.test(candidate) && candidate.length <= 80) {
    return candidate;
  }

  if (callerNumber) {
    return `Caller ending ${callerNumber.slice(-4)}`;
  }

  return "Incoming caller";
}

function mapPatientStatusFromCallStatus(status: Call["status"] | PatientLead["status"]): Patient["status"] {
  if (status === "booked" || status === "won" || status === "recovered") return "active";
  if (status === "lost" || status === "opted_out") return "inactive";
  if (status === "archived") return "archived";
  return "lead";
}

async function ensurePatientProfileForCall(input: {
  callerNumber: string | null;
  clinicId: string;
  createdBy: string | null;
  lead: PatientLead | null;
}) {
  const normalizedPhone = normalizePhoneNumber(input.callerNumber);
  if (!normalizedPhone) {
    return { error: null, patient: null as Patient | null };
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const fullName = buildPatientDisplayName(normalizedPhone, input.lead?.enquiry_summary ?? null);
  const notes = input.lead?.enquiry_summary ?? `Captured from a Twilio call from ${normalizedPhone}.`;
  const status = mapPatientStatusFromCallStatus(input.lead?.status ?? "new");

  const { data: existing, error: existingError } = await admin
    .from("patients")
    .select("*")
    .eq("clinic_id", input.clinicId)
    .eq("phone", normalizedPhone)
    .maybeSingle<Patient>();

  if (existingError) {
    return { error: existingError.message, patient: null as Patient | null };
  }

  if (existing) {
    const { data, error } = await admin
      .from("patients")
      .update({
        full_name: fullName || existing.full_name,
        notes,
        phone: normalizedPhone,
        status,
        updated_by: input.createdBy,
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("clinic_id", input.clinicId)
      .select("*")
      .single<Patient>();

    return { error: error?.message ?? null, patient: data ?? existing };
  }

  const { data, error } = await admin
    .from("patients")
    .insert({
      clinic_id: input.clinicId,
      created_by: input.createdBy,
      full_name: fullName,
      notes,
      phone: normalizedPhone,
      source: "phone",
      status,
      updated_by: input.createdBy,
    })
    .select("*")
    .single<Patient>();

  return { error: error?.message ?? null, patient: data ?? null };
}

async function upsertCallRecord(input: {
  callSid: string;
  classification: ReturnType<typeof classifyTwilioCall>;
  clinicId: string;
  leadId: string | null;
  previousCall: Call | null;
  callDurationSeconds: number | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const callerNumberHash = hashPhoneNumber(input.classification.callerNumber);
  const callerNumberLast4 = normalizePhoneNumber(input.classification.callerNumber)?.slice(-4) ?? null;
  const clinicNumber = normalizePhoneNumber(input.classification.clinicNumber) ?? input.classification.clinicNumber;
  const finalEvent = input.classification.finalStatus;

  const payload: Inserts<"calls"> = {
    caller_number_hash: callerNumberHash,
    caller_number_last4: callerNumberLast4,
    clinic_id: input.clinicId,
    clinic_number: clinicNumber,
    direction: "inbound" as const,
    duration_seconds: input.callDurationSeconds ?? input.previousCall?.duration_seconds ?? null,
    ended_at: finalEvent === "queued" ? input.previousCall?.ended_at ?? null : now,
    lead_id: input.leadId ?? input.previousCall?.lead_id ?? null,
    provider: "twilio" as const,
    provider_call_id: input.callSid,
    recovery_next_action:
      input.classification.isMissed || input.classification.isVoicemail || input.classification.isAbandoned
        ? "Send a recovery SMS and wait for reply."
        : "No recovery needed.",
    recovery_status:
      input.classification.isMissed || input.classification.isVoicemail || input.classification.isAbandoned
        ? "queued"
        : "closed",
    recovery_updated_at: now,
    started_at: input.previousCall?.started_at ?? now,
    status: input.classification.finalStatus,
    updated_at: now,
  };

  if (input.previousCall) {
    const { data, error } = await admin.from("calls").update(payload).eq("id", input.previousCall.id).eq("clinic_id", input.clinicId).select("*").single<Call>();
    return { call: data ?? input.previousCall, error: error?.message ?? null };
  }

  const { data, error } = await admin.from("calls").insert(payload).select("*").single<Call>();
  return { call: data ?? null, error: error?.message ?? null };
}

async function findExistingCall(clinicId: string, callSid: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("calls")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("provider_call_id", callSid)
    .is("deleted_at", null)
    .maybeSingle<Call>();

  if (error) {
    return { call: null, error: error.message };
  }

  return { call: data ?? null, error: null };
}

async function findExistingLead(clinicId: string, callSid: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("patient_leads")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("source", "missed_call")
    .ilike("enquiry_summary", `%Call SID: ${callSid}.%`)
    .maybeSingle<PatientLead>();

  if (error) {
    return { lead: null, error: error.message };
  }

  return { lead: data ?? null, error: null };
}

async function ensureLeadForMissedCall(input: {
  callSid: string;
  call: Call;
  classification: ReturnType<typeof classifyTwilioCall>;
  connection: TwilioConnection;
}) {
  const admin = createSupabaseAdminClient();
  const { lead: existingLead, error: existingLeadError } = await findExistingLead(input.connection.clinic_id, input.callSid);

  if (existingLeadError) {
    return { lead: null, error: existingLeadError };
  }

  if (existingLead) {
    return { lead: existingLead, error: null };
  }

  const leadSummary = buildLeadSummary({
    callSid: input.callSid,
    callerNumber: input.classification.callerNumber,
    clinicNumber: input.classification.clinicNumber,
    note: "Automated missed-call recovery lead created from a Twilio webhook.",
  });

  const { data, error } = await admin
    .from("patient_leads")
    .insert({
      clinic_id: input.connection.clinic_id,
      created_by: input.connection.created_by,
      enquiry_summary: leadSummary,
      estimated_value_pence: 0,
      gdpr_lawful_basis: "legitimate_interest",
      lead_score: 70,
      marketing_consent: false,
      owner_user_id: input.connection.created_by,
      priority: "urgent",
      source: "missed_call",
      status: "new",
      updated_by: input.connection.created_by,
    })
    .select("*")
    .single<PatientLead>();

  return { lead: data ?? null, error: error?.message ?? null };
}

async function ensureRecoveryWorkflow(input: {
  call: Call;
  connection: TwilioConnection;
  lead: PatientLead | null;
  patient: Patient | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data: existingWorkflow, error: existingWorkflowError } = await admin
    .from("recovery_workflows")
    .select("*")
    .eq("clinic_id", input.connection.clinic_id)
    .eq("call_id", input.call.id)
    .is("deleted_at", null)
    .maybeSingle<RecoveryWorkflow>();

  if (existingWorkflowError) {
    return { workflow: null, error: existingWorkflowError.message };
  }

  if (existingWorkflow) {
    if (input.patient && existingWorkflow.patient_id !== input.patient.id) {
      const { data: updatedWorkflow, error: updateError } = await admin
        .from("recovery_workflows")
        .update({
          patient_id: input.patient.id,
        })
        .eq("id", existingWorkflow.id)
        .eq("clinic_id", input.connection.clinic_id)
        .select("*")
        .single<RecoveryWorkflow>();

      return {
        error: updateError?.message ?? null,
        workflow: updatedWorkflow ?? { ...existingWorkflow, patient_id: input.patient.id },
      };
    }

    return { workflow: existingWorkflow, error: null };
  }

  const { data, error } = await admin
    .from("recovery_workflows")
    .insert({
      assigned_user_id: input.connection.created_by,
      call_id: input.call.id,
      channel: "sms",
      clinic_id: input.connection.clinic_id,
      current_step: 1,
      lead_id: input.lead?.id ?? input.call.lead_id ?? null,
      max_steps: 3,
      next_action_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      patient_id: input.patient?.id ?? null,
      state: "queued",
    })
    .select("*")
    .single<RecoveryWorkflow>();

  return { workflow: data ?? null, error: error?.message ?? null };
}

async function ensureSmsRecovery(input: {
  call: Call;
  connection: TwilioConnection;
  callerNumber: string | null;
  clinicName: string | null;
  lead: PatientLead | null;
  workflow: RecoveryWorkflow;
}) {
  const admin = createSupabaseAdminClient();
  const { data: existingSms, error: existingSmsError } = await admin
    .from("sms_events")
    .select("*")
    .eq("clinic_id", input.connection.clinic_id)
    .eq("recovery_workflow_id", input.workflow.id)
    .eq("direction", "outbound")
    .maybeSingle<SmsEvent>();

  if (existingSmsError) {
    return { smsEvent: null, error: existingSmsError.message };
  }

  if (existingSms) {
    if (existingSms.status !== "failed") {
      await admin
        .from("recovery_workflows")
        .update({
          current_step: Math.max(input.workflow.current_step, 2),
          next_action_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          state: "sms_sent",
        })
        .eq("id", input.workflow.id)
        .eq("clinic_id", input.connection.clinic_id);

      await admin
        .from("calls")
        .update({
          recovery_next_action: "Waiting for the patient to reply.",
          recovery_status: "sms_sent",
          recovery_updated_at: new Date().toISOString(),
        })
        .eq("id", input.call.id)
        .eq("clinic_id", input.connection.clinic_id);
    }

    return { smsEvent: existingSms, error: null };
  }

  const draft = createRecoverySmsDraft({ clinicName: input.clinicName, patientPhone: input.callerNumber });
  const sendResult = await sendRecoverySms({ connection: input.connection, draft });

  if (sendResult.error) {
    const { data: failedSms, error: failedSmsError } = await admin
      .from("sms_events")
      .insert({
        body_preview: draft.body,
        call_id: input.call.id,
        clinic_id: input.connection.clinic_id,
        direction: "outbound",
        error_message: sendResult.error,
        from_number_hash: hashPhoneNumber(input.connection.voice_number),
        lead_id: input.lead?.id ?? input.call.lead_id ?? null,
        occurred_at: new Date().toISOString(),
        provider: "twilio",
        provider_message_id: `failed-${input.call.provider_call_id ?? getShortId(input.call.id)}`,
      recovery_workflow_id: input.workflow.id,
      status: "failed",
      to_number_hash: input.call.caller_number_hash,
      to_number_last4: input.call.caller_number_last4,
      })
      .select("*")
      .single<SmsEvent>();

    await admin
      .from("recovery_workflows")
      .update({
        last_error: sendResult.error,
        next_action_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        state: "failed",
      })
      .eq("id", input.workflow.id)
      .eq("clinic_id", input.connection.clinic_id);

    await admin
      .from("calls")
      .update({
        recovery_next_action: "Review Twilio SMS setup and resend the recovery message.",
        recovery_status: "failed",
        recovery_updated_at: new Date().toISOString(),
      })
      .eq("id", input.call.id)
      .eq("clinic_id", input.connection.clinic_id);

    return { smsEvent: failedSms ?? null, error: failedSmsError?.message ?? null };
  }

  const { data, error } = await admin
    .from("sms_events")
    .insert({
      body_preview: draft.body,
      call_id: input.call.id,
      clinic_id: input.connection.clinic_id,
      direction: "outbound",
      from_number_hash: hashPhoneNumber(input.connection.voice_number),
      lead_id: input.lead?.id ?? input.call.lead_id ?? null,
      occurred_at: new Date().toISOString(),
      provider: "twilio",
      provider_message_id: sendResult.messageSid ?? `twilio-${input.call.provider_call_id ?? getShortId(input.call.id)}`,
      recovery_workflow_id: input.workflow.id,
      status: "sent",
      to_number_hash: input.call.caller_number_hash,
      to_number_last4: input.call.caller_number_last4,
    })
    .select("*")
    .single<SmsEvent>();

  await admin
    .from("recovery_workflows")
    .update({
      current_step: Math.max(input.workflow.current_step, 2),
      next_action_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      state: "sms_sent",
    })
    .eq("id", input.workflow.id)
    .eq("clinic_id", input.connection.clinic_id);

  await admin
    .from("calls")
    .update({
      recovery_next_action: "Waiting for the patient to reply.",
      recovery_status: "sms_sent",
      recovery_updated_at: new Date().toISOString(),
    })
    .eq("id", input.call.id)
    .eq("clinic_id", input.connection.clinic_id);

  return { smsEvent: data ?? null, error: error?.message ?? null };
}

function classifyReplyBody(body: string) {
  const normalized = body.trim().toLowerCase();
  if (!normalized) return "replied" as const;
  // Treat common opt-out phrases as a hard stop so recovery state, calls, and leads stay aligned.
  if (/(?:^|\b)(stop|unsubscribe|opt out|opt-out|cancel|decline|no thanks|not now)(?:\b|$)/.test(normalized)) return "opted_out" as const;
  if (/(?:^|\b)(book|booked|appointment|slot)(?:\b|$)/.test(normalized)) return "booked" as const;
  if (/(?:^|\b)(yes|yes please|call me back|ok|okay|sure|yep|yeah)(?:\b|$)/.test(normalized)) return "recovered" as const;
  return "replied" as const;
}

function replyStateToWorkflowState(replyState: "replied" | "booked" | "recovered" | "opted_out"): RecoveryWorkflow["state"] {
  if (replyState === "opted_out") return "opted_out";
  if (replyState === "recovered") return "recovered";
  if (replyState === "booked") return "booked";
  return "replied";
}

function replyStateToCallRecoveryStatus(replyState: "replied" | "booked" | "recovered" | "opted_out"): Call["recovery_status"] {
  if (replyState === "booked") return "booked";
  if (replyState === "recovered") return "recovered";
  if (replyState === "opted_out") return "lost";
  return "replied";
}

function replyStateToLeadStatus(replyState: "replied" | "booked" | "recovered" | "opted_out", currentStatus: PatientLead["status"]) {
  if (replyState === "booked") return "booked" as const;
  if (replyState === "recovered") return "recovered" as const;
  if (replyState === "opted_out") return "opted_out" as const;
  return currentStatus;
}

function replyStateToNextAction(replyState: "replied" | "booked" | "recovered" | "opted_out") {
  if (replyState === "booked") return "Lead booked. Update the schedule and close the loop.";
  if (replyState === "recovered") return "Lead recovered. Call back and confirm the next step.";
  if (replyState === "opted_out") return "Patient opted out of SMS recovery.";
  return "Awaiting staff follow-up.";
}

async function updateCallAndLeadFromReply(input: {
  call: Call;
  clinicId: string;
  lead: PatientLead | null;
  workflow: RecoveryWorkflow;
  replyState: "replied" | "booked" | "recovered" | "opted_out";
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const workflowState = replyStateToWorkflowState(input.replyState);
  const callRecoveryStatus = replyStateToCallRecoveryStatus(input.replyState);

  await admin
    .from("recovery_workflows")
    .update({
      current_step: input.replyState === "booked" || input.replyState === "recovered" ? Math.max(input.workflow.current_step, 3) : Math.max(input.workflow.current_step, 2),
      next_action_at: input.replyState === "booked" || input.replyState === "recovered" || input.replyState === "opted_out" ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      state: workflowState,
    })
    .eq("id", input.workflow.id)
    .eq("clinic_id", input.clinicId);

  await admin
    .from("calls")
    .update({
      recovery_next_action: replyStateToNextAction(input.replyState),
      recovery_status: callRecoveryStatus,
      recovery_updated_at: now,
      status: input.replyState === "booked" || input.replyState === "recovered" ? "recovered" : input.call.status,
    })
    .eq("id", input.call.id)
    .eq("clinic_id", input.clinicId);

  if (input.lead) {
    await admin
      .from("patient_leads")
      .update({
        converted_at: input.replyState === "booked" ? now : input.lead.converted_at,
        loss_reason:
          input.replyState === "opted_out"
            ? "Patient opted out of SMS recovery."
            : input.replyState === "booked"
              ? null
              : input.lead.loss_reason,
        status: replyStateToLeadStatus(input.replyState, input.lead.status),
        updated_at: now,
      })
      .eq("id", input.lead.id)
      .eq("clinic_id", input.clinicId);
  }
}

export async function refreshCallReceptionSummary(input: {
  call: Call;
  clinicName: string;
  connection: TwilioConnection;
  lead?: PatientLead | null;
}) {
  const admin = createSupabaseAdminClient();

  const [{ data: lead }, { data: smsEvents }, { data: transcript }, { data: voicemail }] = await Promise.all([
    input.lead
      ? Promise.resolve({ data: input.lead })
      : input.call.lead_id
        ? admin.from("patient_leads").select("*").eq("clinic_id", input.connection.clinic_id).eq("id", input.call.lead_id).maybeSingle<PatientLead>()
        : Promise.resolve({ data: null as PatientLead | null }),
    admin
      .from("sms_events")
      .select("body_preview,direction,status,occurred_at")
      .eq("clinic_id", input.connection.clinic_id)
      .eq("call_id", input.call.id)
      .order("occurred_at", { ascending: false })
      .limit(8)
      .returns<Pick<SmsEvent, "body_preview" | "direction" | "status" | "occurred_at">[]>(),
    admin
      .from("call_transcripts")
      .select("summary,transcript_text,updated_at")
      .eq("clinic_id", input.connection.clinic_id)
      .eq("call_id", input.call.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<CallTranscript, "summary" | "transcript_text" | "updated_at">>(),
    admin
      .from("voicemail_messages")
      .select("summary,transcript_text,updated_at")
      .eq("clinic_id", input.connection.clinic_id)
      .eq("call_id", input.call.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<VoicemailMessage, "summary" | "transcript_text" | "updated_at">>(),
  ]);

  const summaryResult = await generateCallReceptionSummary({
    call: input.call,
    clinicName: input.clinicName,
    lead: lead ?? null,
    smsEvents: smsEvents ?? [],
    transcript: transcript ?? null,
    voicemail: voicemail ?? null,
  });

  const summary = summaryResult.summary;
  const now = new Date().toISOString();

  const { error: auditError } = await admin.from("ai_audit_logs").insert({
    action: "summary_created",
    actor_user_id: input.connection.created_by,
    call_id: input.call.id,
    clinic_id: input.connection.clinic_id,
    human_approved: false,
    input_hash: summaryResult.inputHash,
    lead_id: lead?.id ?? input.call.lead_id ?? null,
    metadata: {
      ...summary,
      source_text: [input.clinicName, input.call.status, lead?.enquiry_summary ?? null, transcript?.transcript_text ?? null, voicemail?.transcript_text ?? null]
        .filter(Boolean)
        .join(" "),
      updated_at: now,
    },
    model_name: summaryResult.modelName,
    model_provider: summaryResult.modelProvider,
    output_hash: summaryResult.outputHash,
    prompt_version: "twilio-call-reception-summary-v1",
    safety_status: "not_required",
  });

  if (auditError) {
    return { error: auditError.message, summary };
  }

  await admin
    .from("calls")
    .update({
      recovery_next_action: summary.followUpRecommendation,
      recovery_updated_at: now,
    })
    .eq("id", input.call.id)
    .eq("clinic_id", input.connection.clinic_id);

  return { error: null, summary };
}

export async function processTwilioCallWebhook(payload: TwilioWebhookPayload) {
  const classification = classifyTwilioCall(payload);
  const connectionResult = await findTwilioConnectionForPayload(payload);

  if (connectionResult.error) {
    return { error: connectionResult.error, ok: false };
  }

  const connection = connectionResult.connection;
  if (!connection) {
    return { error: "No active Twilio connection found for this number.", ok: false };
  }

  const connectionView = toTwilioConnectionView(connection);
  const clinicName = await getClinicName(connection.clinic_id);
  const baseSummary = {
    clinicId: connection.clinic_id,
    connection: connectionView,
    lead: null as PatientLead | null,
    smsEvent: null as SmsEvent | null,
    workflow: null as RecoveryWorkflow | null,
  };

  const callLookup = await findExistingCall(connection.clinic_id, classification.callSid ?? "");
  if (callLookup.error) {
    return { ...baseSummary, error: callLookup.error, ok: false };
  }

  const callResult = await upsertCallRecord({
    callSid: classification.callSid ?? `twilio-${getShortId(connection.id)}-${Date.now().toString(36)}`,
    callDurationSeconds: Number.isFinite(Number(payload.CallDuration)) ? Number(payload.CallDuration) : null,
    classification,
    clinicId: connection.clinic_id,
    leadId: callLookup.call?.lead_id ?? null,
    previousCall: callLookup.call,
  });

  if (callResult.error) {
    return { ...baseSummary, error: callResult.error, ok: false };
  }

  const call = callResult.call;
  if (!call) {
    return { ...baseSummary, error: "Could not persist the Twilio call record.", ok: false };
  }

  const patientResult = await ensurePatientProfileForCall({
    callerNumber: classification.callerNumber,
    clinicId: connection.clinic_id,
    createdBy: connection.created_by,
    lead: null,
  });

  if (patientResult.error) {
    logTwilioError("patient_profile_failed", patientResult.error, {
      callSid: call.provider_call_id ?? classification.callSid ?? call.id,
      clinicId: connection.clinic_id,
    });
  }

  if (classification.isMissed || classification.isVoicemail || classification.isAbandoned) {
    const leadResult = await ensureLeadForMissedCall({
      callSid: classification.callSid ?? call.provider_call_id ?? call.id,
      call,
      classification,
      connection,
    });

    if (leadResult.error) {
      return { ...baseSummary, call, error: leadResult.error, ok: false };
    }

    const summary = {
      ...baseSummary,
      call,
      lead: leadResult.lead,
    };

    const admin = createSupabaseAdminClient();
    if (leadResult.lead && !call.lead_id) {
      await admin
        .from("calls")
        .update({
          lead_id: leadResult.lead.id,
          recovery_updated_at: new Date().toISOString(),
        })
        .eq("id", call.id)
        .eq("clinic_id", connection.clinic_id);
      call.lead_id = leadResult.lead.id;
    }

    const patientBridgeResult = await ensurePatientProfileForCall({
      callerNumber: classification.callerNumber,
      clinicId: connection.clinic_id,
      createdBy: connection.created_by,
      lead: leadResult.lead,
    });

    if (patientBridgeResult.error) {
      logTwilioError("patient_profile_refresh_failed", patientBridgeResult.error, {
        callSid: call.provider_call_id ?? classification.callSid ?? call.id,
        clinicId: connection.clinic_id,
      });
    }

    const workflowResult = await ensureRecoveryWorkflow({
      call: { ...call, lead_id: leadResult.lead?.id ?? call.lead_id ?? null },
      connection,
      lead: leadResult.lead,
      patient: patientBridgeResult.patient,
    });

    if (workflowResult.error) {
      return { ...summary, error: workflowResult.error, ok: false };
    }

    summary.workflow = workflowResult.workflow;

    if (workflowResult.workflow && !summary.smsEvent) {
      const smsResult = await ensureSmsRecovery({
        call: { ...call, lead_id: leadResult.lead?.id ?? call.lead_id ?? null },
        connection,
        callerNumber: classification.callerNumber,
        clinicName,
        lead: leadResult.lead,
        workflow: workflowResult.workflow,
      });

      if (smsResult.error) {
        return { ...summary, error: smsResult.error, ok: false };
      }

      summary.smsEvent = smsResult.smsEvent;
    }

    const aiSummaryResult = await refreshCallReceptionSummary({
      call: { ...call, lead_id: leadResult.lead?.id ?? call.lead_id ?? null },
      clinicName: clinicName ?? "ClinicFlow clinic",
      connection,
      lead: leadResult.lead ?? null,
    });

    if (aiSummaryResult.error) {
      logTwilioError("summary_refresh_failed", aiSummaryResult.error, {
        callSid: call.provider_call_id ?? classification.callSid ?? call.id,
        clinicId: connection.clinic_id,
      });
    }

    return { ...summary, ok: true };
  }

  const aiSummaryResult = await refreshCallReceptionSummary({
    call,
    clinicName: clinicName ?? "ClinicFlow clinic",
    connection,
    lead: null,
  });

  if (aiSummaryResult.error) {
    logTwilioError("summary_refresh_failed", aiSummaryResult.error, {
      callSid: call.provider_call_id ?? classification.callSid ?? call.id,
      clinicId: connection.clinic_id,
    });
  }

  return { ...baseSummary, call, ok: true };
}

export async function processTwilioSmsWebhook(payload: TwilioWebhookPayload) {
  const admin = createSupabaseAdminClient();
  const incomingNumber = normalizePhoneNumber(payload.From);
  const clinicNumber = normalizePhoneNumber(payload.To);
  const incomingNumberHash = hashPhoneNumber(incomingNumber);

  if (!incomingNumber || !clinicNumber || !incomingNumberHash) {
    return { error: "Missing SMS routing number.", ok: false };
  }

  const { connection, error } = await getTwilioConnectionForVoiceNumber(clinicNumber);
  if (error) {
    return { error, ok: false };
  }

  if (!connection) {
    return { error: "No active Twilio connection found for this number.", ok: false };
  }

  const { data: latestOutbound, error: outboundError } = await admin
    .from("sms_events")
    .select("*")
    .eq("clinic_id", connection.clinic_id)
    .eq("direction", "outbound")
    .eq("to_number_hash", incomingNumberHash)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle<SmsEvent>();

  if (outboundError) {
    return { error: outboundError.message, ok: false };
  }

  if (!latestOutbound) {
    return { error: "No recovery thread found for this reply.", ok: false };
  }

  const { data: call, error: callError } = await admin
    .from("calls")
    .select("*")
    .eq("clinic_id", connection.clinic_id)
    .eq("id", latestOutbound.call_id ?? "")
    .maybeSingle<Call>();

  if (callError) {
    return { error: callError.message, ok: false };
  }

  if (!call) {
    return { error: "Linked call record is missing.", ok: false };
  }

  const { data: workflow, error: workflowError } = await admin
    .from("recovery_workflows")
    .select("*")
    .eq("clinic_id", connection.clinic_id)
    .eq("id", latestOutbound.recovery_workflow_id ?? "")
    .maybeSingle<RecoveryWorkflow>();

  if (workflowError) {
    return { error: workflowError.message, ok: false };
  }

  if (!workflow) {
    return { error: "Linked recovery workflow is missing.", ok: false };
  }

  let lead: PatientLead | null = null;
  if (latestOutbound.lead_id) {
    const { data, error: leadError } = await admin
      .from("patient_leads")
      .select("*")
      .eq("clinic_id", connection.clinic_id)
      .eq("id", latestOutbound.lead_id)
      .maybeSingle<PatientLead>();

    if (leadError) {
      return { error: leadError.message, ok: false };
    }

    lead = data ?? null;
  }

  const replyState = classifyReplyBody(payload.Body ?? "");
  const { error: inboundSmsError } = await admin
    .from("sms_events")
    .insert({
      body_preview: payload.Body?.slice(0, 500) || "Inbound reply",
      call_id: call.id,
      clinic_id: connection.clinic_id,
      direction: "inbound",
      from_number_hash: hashPhoneNumber(incomingNumber),
      lead_id: lead?.id ?? latestOutbound.lead_id,
      occurred_at: new Date().toISOString(),
      provider: "twilio",
      provider_message_id: payload.MessageSid || `reply-${call.provider_call_id ?? call.id}`,
      recovery_workflow_id: workflow.id,
      status: "received",
      to_number_hash: hashPhoneNumber(clinicNumber),
      to_number_last4: clinicNumber.slice(-4),
    });

  if (inboundSmsError) {
    return { error: inboundSmsError.message, ok: false };
  }

  await updateCallAndLeadFromReply({
    call,
    clinicId: connection.clinic_id,
    lead: lead ?? null,
    replyState,
    workflow,
  });

  const clinicName = await getClinicName(connection.clinic_id);
  const aiSummaryResult = await refreshCallReceptionSummary({
    call,
    clinicName: clinicName ?? "ClinicFlow clinic",
    connection,
    lead,
  });

  if (aiSummaryResult.error) {
    console.error("[ClinicFlow Twilio]", "summary_refresh_failed", JSON.stringify({
      callSid: call.provider_call_id ?? call.id,
      clinicId: connection.clinic_id,
      error: aiSummaryResult.error,
    }));
  }

  return {
    ok: true,
    replyState,
  };
}
