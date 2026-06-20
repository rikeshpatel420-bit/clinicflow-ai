import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Call, Inserts, PatientLead, RecoveryWorkflow, SmsEvent, TwilioConnection } from "@/types/database";
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

async function findTwilioConnectionForPayload(payload: TwilioWebhookPayload) {
  const lookupNumber = normalizePhoneNumber(payload.To || payload.Called);
  if (!lookupNumber) {
    return { connection: null, error: "Missing Twilio destination number." };
  }

  return getTwilioConnectionForVoiceNumber(lookupNumber);
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

  const draft = createRecoverySmsDraft({ patientPhone: input.callerNumber });
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
  if (/(book|booked|appointment|slot|yes please|call me back)/.test(normalized)) return "booked" as const;
  if (/(lost|no thanks|stop|not now|cancel|decline)/.test(normalized)) return "lost" as const;
  return "replied" as const;
}

async function updateCallAndLeadFromReply(input: {
  call: Call;
  clinicId: string;
  lead: PatientLead | null;
  workflow: RecoveryWorkflow;
  replyState: "replied" | "booked" | "lost";
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("recovery_workflows")
    .update({
      current_step: input.replyState === "booked" ? Math.max(input.workflow.current_step, 3) : Math.max(input.workflow.current_step, 2),
      next_action_at: input.replyState === "booked" || input.replyState === "lost" ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      state: input.replyState,
    })
    .eq("id", input.workflow.id)
    .eq("clinic_id", input.clinicId);

  await admin
    .from("calls")
    .update({
      recovery_next_action:
        input.replyState === "booked"
          ? "Lead booked. Update the schedule and close the loop."
          : input.replyState === "lost"
            ? "Mark the recovery as lost and archive the follow-up."
            : "Awaiting staff follow-up.",
      recovery_status: input.replyState,
      recovery_updated_at: now,
      status: input.replyState === "booked" ? "recovered" : input.call.status,
    })
    .eq("id", input.call.id)
    .eq("clinic_id", input.clinicId);

  if (input.lead) {
    await admin
      .from("patient_leads")
      .update({
        converted_at: input.replyState === "booked" ? now : input.lead.converted_at,
        loss_reason: input.replyState === "lost" ? "No response after recovery SMS." : input.lead.loss_reason,
        status: input.replyState === "booked" ? "booked" : input.replyState === "lost" ? "lost" : input.lead.status,
        updated_at: now,
      })
      .eq("id", input.lead.id)
      .eq("clinic_id", input.clinicId);
  }
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

    const workflowResult = await ensureRecoveryWorkflow({
      call: { ...call, lead_id: leadResult.lead?.id ?? call.lead_id ?? null },
      connection,
      lead: leadResult.lead,
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
        lead: leadResult.lead,
        workflow: workflowResult.workflow,
      });

      if (smsResult.error) {
        return { ...summary, error: smsResult.error, ok: false };
      }

      summary.smsEvent = smsResult.smsEvent;
    }

    return { ...summary, ok: true };
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

  return {
    ok: true,
    replyState,
  };
}
