import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Call, CallRecording, CallTranscript, Json, RecoveryWorkflow, SmsEvent, TwilioConnection, VoicemailMessage } from "@/types/database";
import { normalizePhoneNumber } from "./crypto";
import { logTwilioDbWriteFailure } from "./db-write";
import { getTwilioConnectionForClinic, getTwilioConnectionForVoiceNumber, resolveTwilioSignatureAuthToken } from "./config";
import { parseTwilioFormData, type TwilioWebhookPayload } from "./missed-call";
import { processTwilioCallWebhook, processTwilioSmsWebhook, refreshCallReceptionSummary } from "./recovery";
import {
  buildVoiceFollowUpPrompt,
  buildVoiceGreetingMessage,
  buildVoiceLeadSummary,
  buildVoiceTranscriptSummary,
  classifyTreatmentType,
  classifyVoiceIntent,
  extractVoiceCaptureDetails,
  estimateVoiceUrgency,
  treatmentLabel,
  type VoiceCaptureDetails,
  type VoiceIntent,
} from "./voice-triage";
import { resolveTwilioPublicOrigin, verifyTwilioSignature, type TwilioWebhookType } from "./verification";
import type { NextRequest } from "next/server";

const TWILIO_SPEAK_VOICE = "Polly.Amy-Neural";
const TWILIO_SPEAK_LANGUAGE = "en-GB";

export type TwilioExtendedWebhookPayload = TwilioWebhookPayload & {
  Digits?: string;
  RecordingDuration?: string;
  RecordingSid?: string;
  RecordingSource?: string;
  RecordingStatus?: string;
  RecordingUrl?: string;
  SpeechResult?: string;
  TranscriptionConfidence?: string;
  TranscriptionStatus?: string;
  TranscriptionText?: string;
};

export type TwilioOperationsDashboardData = {
  activeCalls: Call[];
  error: string | null;
  missedCalls: Call[];
  recordings: CallRecording[];
  recentCalls: Call[];
  smsConversations: SmsEvent[];
  transcripts: CallTranscript[];
  voicemails: VoicemailMessage[];
  warnings: string[];
};

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildSayTwiml(text: string | string[], options: { pauseMs?: number; rate?: string } = {}) {
  const segments = Array.isArray(text) ? text : String(text).split(/(?<=[.!?])\s+/);
  const pauseMs = options.pauseMs ?? (segments.length > 1 ? 220 : 0);
  const content = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => escapeXml(segment))
    .join(pauseMs > 0 ? ` <break time="${pauseMs}ms"/> ` : " ");

  return `<Say voice="${TWILIO_SPEAK_VOICE}" language="${TWILIO_SPEAK_LANGUAGE}"><prosody rate="${options.rate ?? '94%'}">${content}</prosody></Say>`;
}

function buildWebhookBaseUrl(request: Request) {
  return resolveTwilioPublicOrigin(request as NextRequest);
}

function buildInvalidVoiceTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSayTwiml(["Sorry, ClinicFlow could not verify this call right now.", "Please try again shortly."])}
  <Hangup />
</Response>`;
}

function webhookFailureHeaders(verification: { diagnostics?: { authTokenDecrypted: boolean; authTokenSource: string; requestPath: string; resolvedPublicUrl: string; signatureHeaderExists: boolean; validationResult: string; webhookType: string } }, testMode: boolean) {
  return {
    "X-ClinicFlow-Test-Mode": String(testMode),
    "X-ClinicFlow-Twilio-Diagnostics": JSON.stringify(verification.diagnostics ?? {}),
  };
}

function logTwilioVerificationFailure(event: string, verification: { diagnostics?: Record<string, unknown>; reason: string }) {
  console.error("[ClinicFlow Twilio]", event, JSON.stringify({ ...verification.diagnostics, reason: verification.reason }));
}

function buildVoiceFallbackTwiml(input: { clinicName: string; callerId: string; forwardToNumber: string }) {
  const clinicName = escapeXml(input.clinicName);
  const callerId = escapeXml(input.callerId);
  const forwardToNumber = escapeXml(input.forwardToNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSayTwiml([`Sorry, ClinicFlow is having a little trouble just now for ${clinicName}.`, "One moment, and I will put you through to the team now."])}
  <Dial callerId="${callerId}" timeout="20">
    <Number>${forwardToNumber}</Number>
  </Dial>
</Response>`;
}

function buildVoiceGreetingTwiml(input: { clinicName: string; callerId: string; forwardToNumber: string; speechUrl: string }) {
  const clinicName = escapeXml(input.clinicName);
  const speechUrl = escapeXml(input.speechUrl);
  const callerId = escapeXml(input.callerId);
  const forwardToNumber = escapeXml(input.forwardToNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${speechUrl}" input="speech" method="POST" speechTimeout="auto" timeout="6">
    ${buildSayTwiml(buildVoiceGreetingMessage(clinicName), { pauseMs: 260 })}
  </Gather>
  ${buildSayTwiml(["Sorry, I could not hear a response.", "One moment, and I will put you through to the team now."])}
  <Dial callerId="${callerId}" timeout="20">
    <Number>${forwardToNumber}</Number>
  </Dial>
</Response>`;
}

function buildVoiceFollowUpTwiml(input: { clinicName: string; responseText: string }) {
  const clinicName = escapeXml(input.clinicName);
  const responseText = escapeXml(input.responseText);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSayTwiml(responseText || [`Thanks. I've made a note for ${clinicName}.`, "A member of the team will follow up shortly."])}
  <Pause length="1" />
  <Hangup />
</Response>`;
}

function buildVoiceFailureTwiml(input: { clinicName: string; callerId: string; forwardToNumber: string }) {
  return buildVoiceFallbackTwiml({
    callerId: input.callerId,
    clinicName: input.clinicName,
    forwardToNumber: input.forwardToNumber,
  });
}

function buildVoiceEmergencyTransferTwiml(input: { clinicName: string; callerId: string; forwardToNumber: string }) {
  const clinicName = escapeXml(input.clinicName);
  const callerId = escapeXml(input.callerId);
  const forwardToNumber = escapeXml(input.forwardToNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSayTwiml([`I am sorry, but because you mentioned difficulty breathing or swallowing, this needs urgent emergency care now for ${clinicName}.`, "One moment, and I will put you through to the team immediately."])}
  <Dial callerId="${callerId}" timeout="20">
    <Number>${forwardToNumber}</Number>
  </Dial>
</Response>`;
}

function buildVoicemailPromptTwiml(input: { clinicName: string; voicemailUrl: string }) {
  const clinicName = escapeXml(input.clinicName);
  const voicemailUrl = escapeXml(input.voicemailUrl);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSayTwiml([`Hi, you have reached ${clinicName}.`, "Please leave your name and number after the tone, and we will get back to you as soon as we can."])}
  <Record action="${voicemailUrl}" method="POST" maxLength="120" playBeep="true" timeout="5" transcribeCallback="${voicemailUrl}" trim="trim-silence" />
  ${buildSayTwiml(["We did not receive a message.", "Goodbye."])}
</Response>`;
}

function buildVoicemailFailureTwiml(input: { clinicName: string }) {
  const clinicName = escapeXml(input.clinicName);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSayTwiml([`Sorry, ClinicFlow could not finish recording ${clinicName} right now.`, "Please try again shortly."])}
  <Hangup />
</Response>`;
}

function buildWebhookErrorResponse(message: string, status = 500) {
  return Response.json({ ok: false, reason: message }, { status });
}

function logTwilioEvent(event: string, details: Record<string, unknown>) {
  console.info("[ClinicFlow Twilio]", event, JSON.stringify(details));
}

function logTwilioError(event: string, error: unknown, details: Record<string, unknown> = {}) {
  console.error("[ClinicFlow Twilio]", event, JSON.stringify({ ...details, error: error instanceof Error ? error.message : String(error) }));
}

async function recordWebhookEvent(input: {
  clinicId: string | null;
  errorMessage?: string | null;
  eventType: string;
  idempotencyKey: string | null;
  processedAt?: string | null;
  payload: Json;
  processingStatus: "received" | "processed" | "ignored" | "failed";
  providerEventId: string | null;
  receivedAt: string;
}) {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("webhook_events")
      .upsert(
        {
          clinic_id: input.clinicId,
          error_message: input.errorMessage ?? null,
          event_type: input.eventType,
          idempotency_key: input.idempotencyKey,
          payload: input.payload,
          processed_at: input.processedAt ?? null,
          processing_status: input.processingStatus,
          provider: "twilio",
          provider_event_id: input.providerEventId,
          received_at: input.receivedAt,
        },
        { onConflict: "provider,idempotency_key" },
      );

    if (error) {
      logTwilioDbWriteFailure("webhook_event_record_failed", error, {
        clinicId: input.clinicId,
        eventType: input.eventType,
        idempotencyKey: input.idempotencyKey,
        operation: "upsert",
        processingStatus: input.processingStatus,
        providerEventId: input.providerEventId,
        table: "webhook_events",
      });
    }
  } catch (error) {
    logTwilioDbWriteFailure("webhook_event_record_failed", error, {
      clinicId: input.clinicId,
      eventType: input.eventType,
      idempotencyKey: input.idempotencyKey,
      operation: "upsert",
      processingStatus: input.processingStatus,
      providerEventId: input.providerEventId,
      table: "webhook_events",
    });
  }
}

async function resolveTwilioConnection(payload: TwilioExtendedWebhookPayload) {
  const byNumber = await getTwilioConnectionForVoiceNumber(payload.To || payload.Called);
  if (byNumber.connection || byNumber.error || byNumber.tableMissing) {
    return byNumber;
  }

  if (!payload.CallSid) {
    return byNumber;
  }

  const admin = createSupabaseAdminClient();
  const { data: call, error } = await admin.from("calls").select("clinic_id").eq("provider_call_id", payload.CallSid).maybeSingle<{ clinic_id: string }>();
  if (error || !call?.clinic_id) {
    return { connection: null, error: null, tableMissing: false };
  }

  return getTwilioConnectionForClinic(call.clinic_id);
}

async function getClinicName(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("clinics").select("name").eq("id", clinicId).maybeSingle<{ name: string }>();

  if (error || !data?.name) {
    return "your clinic";
  }

  return data.name;
}

function parseExtendedTwilioFormData(formData: FormData): TwilioExtendedWebhookPayload {
  return {
    ...parseTwilioFormData(formData),
    Digits: String(formData.get("Digits") ?? ""),
    RecordingDuration: String(formData.get("RecordingDuration") ?? ""),
    RecordingSid: String(formData.get("RecordingSid") ?? ""),
    RecordingSource: String(formData.get("RecordingSource") ?? ""),
    RecordingStatus: String(formData.get("RecordingStatus") ?? ""),
    RecordingUrl: String(formData.get("RecordingUrl") ?? ""),
    SpeechResult: String(formData.get("SpeechResult") ?? ""),
    TranscriptionConfidence: String(formData.get("TranscriptionConfidence") ?? ""),
    TranscriptionStatus: String(formData.get("TranscriptionStatus") ?? ""),
    TranscriptionText: String(formData.get("TranscriptionText") ?? ""),
  };
}

async function authenticateTwilioWebhook(request: NextRequest, webhookType: TwilioWebhookType) {
  const formData = await request.formData();
  const payload = parseExtendedTwilioFormData(formData);
  const connectionLookup = await resolveTwilioConnection(payload);
  const resolvedAuthToken = resolveTwilioSignatureAuthToken(connectionLookup.connection);
  const verification = await verifyTwilioSignature(request, {
    authToken: resolvedAuthToken.authToken,
    authTokenDecrypted: resolvedAuthToken.authTokenDecrypted,
    authTokenSource: resolvedAuthToken.authTokenSource,
    formData,
    webhookType,
  });

  if (!verification.isValid) {
    logTwilioVerificationFailure(`${webhookType}_signature_failed`, verification);

    if (webhookType === "voice" || webhookType === "speech") {
      return {
        errorResponse: new Response(buildInvalidVoiceTwiml(), {
          headers: {
            "Content-Type": "text/xml",
            ...webhookFailureHeaders(verification, verification.isTestMode),
          },
          status: 200,
        }),
        ok: false as const,
      };
    }

    return {
      errorResponse: Response.json(
        {
          diagnostics: verification.diagnostics,
          ok: false,
          reason: verification.reason,
        },
        {
          status: verification.reason === "Missing Twilio signature." || verification.reason === "Missing Twilio auth token." ? 401 : 403,
        },
      ),
      ok: false as const,
    };
  }

  if (!connectionLookup.connection) {
    return { errorResponse: buildWebhookErrorResponse(connectionLookup.error ?? "No active Twilio connection found for this number."), ok: false as const };
  }

  const resolvedPayload = {
    ...payload,
    Called: payload.Called || connectionLookup.connection.voice_number,
    To: payload.To || connectionLookup.connection.voice_number,
  };

  return {
    connection: connectionLookup.connection,
    ok: true as const,
    payload: resolvedPayload,
    verification,
    testMode: verification.isTestMode,
  };
}

async function storeSpeechTranscript(input: {
  call: Call;
  connection: TwilioConnection;
  payload: TwilioExtendedWebhookPayload;
  source: "speech";
}) {
  const transcriptText = (input.payload.SpeechResult || input.payload.Digits || input.payload.TranscriptionText || "").trim();
  if (!transcriptText) {
    return { error: null, transcript: null as CallTranscript | null };
  }

  const baseTranscriptId = input.payload.RecordingSid || input.payload.MessageSid || input.payload.CallSid || `${input.call.id}-${Date.now().toString(36)}`;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("call_transcripts")
    .upsert(
      {
        call_id: input.call.id,
        clinic_id: input.connection.clinic_id,
        confidence: input.payload.TranscriptionConfidence ? Number(input.payload.TranscriptionConfidence) : null,
        language_code: null,
        provider: "twilio",
        provider_transcript_id: `${baseTranscriptId}-${input.source}`,
        recording_id: null,
        source: input.source,
        status: "ready",
        summary: input.payload.SpeechResult
          ? `Speech capture: ${input.payload.SpeechResult.slice(0, 120)}`
          : input.payload.Digits
            ? `DTMF capture: ${input.payload.Digits}`
            : null,
        transcript_text: transcriptText,
      },
      { onConflict: "provider_transcript_id" },
    )
    .select("*")
    .single<CallTranscript>();

  if (error) {
    logTwilioDbWriteFailure("call_transcript_write_failed", error, {
      callSid: input.call.provider_call_id ?? input.call.id,
      clinicId: input.connection.clinic_id,
      operation: "upsert",
      source: input.source,
      table: "call_transcripts",
    });

    if (isMissingRelationError(error)) {
      return { error: null, transcript: null as CallTranscript | null };
    }
  }

  return { error: error?.message ?? null, transcript: data ?? null };
}

async function storeVoicemailArtifacts(input: {
  call: Call;
  connection: TwilioConnection;
  payload: TwilioExtendedWebhookPayload;
}) {
  const admin = createSupabaseAdminClient();
  const recordingId = input.payload.RecordingSid?.trim() || null;
  const recordingUrl = input.payload.RecordingUrl?.trim() || null;
  const recordingDuration = Number(input.payload.RecordingDuration);
  const voicemailId = input.payload.RecordingSid?.trim() || input.payload.CallSid || `${input.call.id}-voicemail`;
  const transcriptText = (input.payload.TranscriptionText || "").trim() || null;
  const transcriptStatus = input.payload.TranscriptionStatus?.toLowerCase() === "completed" || transcriptText ? "transcribed" : "received";
  const baseTranscriptId = input.payload.RecordingSid || input.payload.CallSid || `${input.call.id}-${Date.now().toString(36)}`;

  let recording: CallRecording | null = null;
  if (recordingId && recordingUrl) {
    const { data, error } = await admin
      .from("call_recordings")
      .upsert(
        {
          call_id: input.call.id,
          clinic_id: input.connection.clinic_id,
          completed_at: new Date().toISOString(),
          provider: "twilio",
          provider_recording_id: recordingId,
          recording_duration_seconds: Number.isFinite(recordingDuration) ? recordingDuration : null,
          recording_url: recordingUrl,
          started_at: null,
          status: transcriptStatus === "transcribed" ? "transcribed" : "available",
        },
        { onConflict: "provider_recording_id" },
      )
      .select("*")
      .single<CallRecording>();

    if (error) {
      logTwilioDbWriteFailure("voicemail_recording_write_failed", error, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: "upsert",
        table: "call_recordings",
      });

      if (!isMissingRelationError(error)) {
        return { error: error.message, recording: null, transcript: null, voicemail: null };
      }
    }

    recording = data ?? null;
  }

  const { data: voicemail, error: voicemailError } = await admin
    .from("voicemail_messages")
    .upsert(
      {
        call_id: input.call.id,
        caller_number_hash: input.call.caller_number_hash,
        caller_number_last4: input.call.caller_number_last4,
        clinic_id: input.connection.clinic_id,
        provider: "twilio",
        provider_voicemail_id: voicemailId,
        received_at: new Date().toISOString(),
        recording_id: recording?.id ?? null,
        status: transcriptStatus,
        summary: transcriptText ? transcriptText.slice(0, 250) : null,
        transcript_text: transcriptText,
      },
      { onConflict: "provider_voicemail_id" },
    )
    .select("*")
    .single<VoicemailMessage>();

  if (voicemailError) {
    logTwilioDbWriteFailure("voicemail_write_failed", voicemailError, {
      callSid: input.call.provider_call_id ?? input.call.id,
      clinicId: input.connection.clinic_id,
      operation: "upsert",
      table: "voicemail_messages",
    });

    if (!isMissingRelationError(voicemailError)) {
      return { error: voicemailError.message, recording, transcript: null, voicemail: null };
    }
  }

  let transcript: CallTranscript | null = null;
  let transcriptErrorRecorded = false;
  if (transcriptText) {
    const { data: transcriptData, error: transcriptError } = await admin
      .from("call_transcripts")
      .upsert(
        {
          call_id: input.call.id,
          clinic_id: input.connection.clinic_id,
          confidence: input.payload.TranscriptionConfidence ? Number(input.payload.TranscriptionConfidence) : null,
          language_code: null,
          provider: "twilio",
          provider_transcript_id: `${baseTranscriptId}-voicemail`,
          recording_id: recording?.id ?? null,
          source: "voicemail",
          status: transcriptStatus === "transcribed" ? "ready" : "pending",
          summary: transcriptText.slice(0, 160),
          transcript_text: transcriptText,
        },
        { onConflict: "provider_transcript_id" },
      )
      .select("*")
      .single<CallTranscript>();

    if (transcriptError) {
      transcriptErrorRecorded = true;
      logTwilioDbWriteFailure("voicemail_transcript_write_failed", transcriptError, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: "upsert",
        table: "call_transcripts",
      });
    }

    transcript = transcriptData ?? null;
  }

  if (!transcript && transcriptText && !transcriptErrorRecorded) {
    logTwilioDbWriteFailure("voicemail_transcript_write_failed", new Error("Transcript was not returned after upsert."), {
      callSid: input.call.provider_call_id ?? input.call.id,
      clinicId: input.connection.clinic_id,
      operation: "upsert",
      table: "call_transcripts",
    });
  }

  return { error: null, recording, transcript, voicemail: voicemail ?? null };
}

function followUpPayloadFromVoicemail(input: TwilioExtendedWebhookPayload): TwilioWebhookPayload {
  return {
    AnsweredBy: "machine",
    Body: input.Body ?? "",
    CallDuration: input.RecordingDuration || input.CallDuration || "",
    CallSid: input.CallSid || "",
    CallStatus: "no-answer",
    Called: input.Called || input.To || "",
    Direction: input.Direction || "inbound",
    From: input.From || "",
    MessageSid: input.RecordingSid || input.MessageSid || "",
    SmsStatus: input.TranscriptionStatus || "",
    To: input.To || input.Called || "",
  };
}

function voiceRecoveryStatusFromIntent(intent: VoiceIntent, details: VoiceCaptureDetails) {
  if (details.breathingOrSwallowingIssue || intent === "dental_emergency" || intent === "complaint") {
    return "queued" as const;
  }

  return "drafted" as const;
}

function voiceWorkflowStateFromIntent(intent: VoiceIntent, details: VoiceCaptureDetails) {
  if (details.breathingOrSwallowingIssue || intent === "complaint") {
    return "awaiting_staff_approval" as const;
  }

  return "drafted" as const;
}

function voicePriorityFromIntent(intent: VoiceIntent, details: VoiceCaptureDetails) {
  if (details.breathingOrSwallowingIssue || intent === "dental_emergency" || intent === "complaint") {
    return "urgent" as const;
  }

  if (intent === "pricing_enquiry" || intent === "message_for_reception") {
    return "normal" as const;
  }

  return "high" as const;
}

function voiceLeadStatusFromIntent(intent: VoiceIntent) {
  if (intent === "complaint" || intent === "dental_emergency") {
    return "contacted" as const;
  }

  if (intent === "pricing_enquiry" || intent === "message_for_reception" || intent === "other_unclear") {
    return "new" as const;
  }

  return "contacted" as const;
}

function voiceEstimatedValuePenceFromIntent(intent: VoiceIntent, treatmentType: ReturnType<typeof classifyTreatmentType>) {
  if (intent === "dental_emergency") return 18000;
  if (intent === "new_patient_appointment") return 9000;
  if (intent === "existing_patient_appointment") return 7000;
  if (intent === "cancellation_reschedule") return 0;
  if (intent === "pricing_enquiry") return 0;
  if (intent === "complaint") return 0;
  if (intent === "message_for_reception") return 0;

  switch (treatmentType) {
    case "implant":
      return 65000;
    case "invisalign_orthodontics":
      return 45000;
    case "whitening":
      return 7000;
    case "hygiene":
      return 9000;
    case "extraction":
      return 12000;
    case "wisdom_tooth":
      return 12000;
    case "sedation":
      return 22000;
    case "cosmetic_bonding":
      return 15000;
    case "check_up":
      return 4500;
    default:
      return 8000;
  }
}

function buildVoiceNextAction(intent: VoiceIntent, details: VoiceCaptureDetails, fallbackPrompt: string) {
  if (details.breathingOrSwallowingIssue) {
    return "Immediate emergency escalation required. Forward to the practice and advise urgent emergency care.";
  }

  switch (intent) {
    case "dental_emergency":
      return "Urgent callback needed. Offer the earliest emergency review and keep a clinician informed.";
    case "new_patient_appointment":
      return "Confirm the details and offer the earliest new patient appointment.";
    case "existing_patient_appointment":
      return "Check the diary and arrange a callback or appointment slot for the existing patient.";
    case "cancellation_reschedule":
      return "Confirm the cancellation or offer a replacement slot for rescheduling.";
    case "treatment_enquiry":
      return "Capture the treatment details and arrange a consultation callback.";
    case "pricing_enquiry":
      return "Call back with general pricing guidance and offer a consultation.";
    case "complaint":
      return "Escalate to the practice manager and call back today.";
    case "message_for_reception":
      return "Pass the message to reception and confirm the contact details.";
    default:
      return fallbackPrompt;
  }
}

async function upsertVoiceTriageArtifacts(input: {
  call: Call;
  clinicName: string;
  connection: TwilioConnection;
  callerNumber: string | null;
  details: VoiceCaptureDetails;
  intent: VoiceIntent;
  stage: "triage" | "collect-details";
  speechText: string;
  treatmentType: ReturnType<typeof classifyTreatmentType>;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const urgency = estimateVoiceUrgency(input.intent, input.details);
  const leadSummary = buildVoiceLeadSummary({
    callSid: input.call.provider_call_id ?? input.call.id,
    callerNumber: input.callerNumber,
    clinicName: input.clinicName,
    details: input.details,
    intent: input.intent,
    treatmentType: input.treatmentType,
  });
  const transcriptSummary = buildVoiceTranscriptSummary({
    details: input.details,
    intent: input.intent,
    treatmentType: input.treatmentType,
    urgency,
  });
  const effectivePhone = normalizePhoneNumber(input.details.mobileNumber || input.callerNumber);
  const patientName = input.details.fullName ?? (input.callerNumber ? `Caller ending ${input.callerNumber.slice(-4)}` : "Incoming caller");

  const { data: transcriptData, error: transcriptError } = await admin
    .from("call_transcripts")
    .upsert(
      {
        call_id: input.call.id,
        clinic_id: input.connection.clinic_id,
        confidence: 0.88,
        language_code: "en-GB",
        provider: "twilio",
        provider_transcript_id: `${input.call.provider_call_id ?? input.call.id}-voice-${input.stage}`,
        source: "speech",
        status: "ready",
        summary: transcriptSummary,
        transcript_text: input.speechText,
      },
      { onConflict: "provider_transcript_id" },
    )
    .select("*")
    .single<CallTranscript>();

  let transcript: CallTranscript | null = transcriptData ?? null;
  if (transcriptError) {
    if (isMissingRelationError(transcriptError)) {
      logTwilioDbWriteFailure("voice_transcript_table_missing", transcriptError, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: "upsert",
        table: "call_transcripts",
      });
      transcript = null;
    } else {
      return { error: transcriptError.message, lead: null as null, patient: null as null, transcript: null as null, workflow: null as null, urgency };
    }
  }

  const leadPayload = {
    clinic_id: input.connection.clinic_id,
    created_by: input.connection.created_by,
    estimated_value_pence: voiceEstimatedValuePenceFromIntent(input.intent, input.treatmentType),
    enquiry_summary: leadSummary,
    gdpr_lawful_basis: "legitimate_interest",
    lead_score: urgency,
    marketing_consent: false,
    next_follow_up_at: detailsFollowUpAt(input.intent, input.details),
    owner_user_id: input.connection.created_by,
    priority: voicePriorityFromIntent(input.intent, input.details),
    source: "phone" as const,
    status: voiceLeadStatusFromIntent(input.intent),
    updated_by: input.connection.created_by,
  };

  const callKey = input.call.provider_call_id ?? input.call.id;
  const { data: existingLead, error: existingLeadError } = await admin
    .from("patient_leads")
    .select("*")
    .eq("clinic_id", input.connection.clinic_id)
    .eq("source", "phone")
    .ilike("enquiry_summary", `%Call SID: ${callKey}.%`)
    .maybeSingle();

  if (existingLeadError) {
    if (isMissingRelationError(existingLeadError)) {
      logTwilioDbWriteFailure("voice_lead_table_missing", existingLeadError, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: "select",
        table: "patient_leads",
      });
    } else {
      return { error: existingLeadError.message, lead: null as null, patient: null as null, transcript: transcript ?? null, workflow: null as null, urgency };
    }
  }

  const leadResult = existingLead
    ? await admin
        .from("patient_leads")
        .update(leadPayload)
        .eq("id", existingLead.id)
        .eq("clinic_id", input.connection.clinic_id)
        .select("*")
        .single()
    : await admin.from("patient_leads").insert(leadPayload).select("*").single();

  if (leadResult.error) {
    if (isMissingRelationError(leadResult.error)) {
      logTwilioDbWriteFailure("voice_lead_write_table_missing", leadResult.error, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: existingLead ? "update" : "insert",
        table: "patient_leads",
      });
    } else {
      return { error: leadResult.error.message, lead: null as null, patient: null as null, transcript: transcript ?? null, workflow: null as null, urgency };
    }
  }

  const lead = leadResult.data ?? existingLead ?? null;

  const { data: existingPatient, error: existingPatientError } = effectivePhone
    ? await admin.from("patients").select("*").eq("clinic_id", input.connection.clinic_id).eq("phone", effectivePhone).maybeSingle()
    : { data: null as null, error: null as null };

  if (existingPatientError) {
    if (isMissingRelationError(existingPatientError)) {
      logTwilioError("voice_patient_table_missing", existingPatientError, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
      });
    } else {
      return { error: existingPatientError.message, lead: lead ?? null, patient: null as null, transcript: transcript ?? null, workflow: null as null, urgency };
    }
  }

  const patientPayload = {
    clinic_id: input.connection.clinic_id,
    created_by: input.connection.created_by,
    email: input.details.email ?? null,
    full_name: patientName,
    notes: leadSummary,
    phone: effectivePhone,
    source: "phone" as const,
    status: "lead" as const,
    updated_by: input.connection.created_by,
  };

  const patientResult = effectivePhone
    ? existingPatient
      ? await admin
          .from("patients")
          .update(patientPayload)
          .eq("id", existingPatient.id)
          .eq("clinic_id", input.connection.clinic_id)
          .select("*")
          .single()
      : await admin.from("patients").insert(patientPayload).select("*").single()
    : { data: null as null, error: null as null };

  if (patientResult.error) {
    if (isMissingRelationError(patientResult.error)) {
      logTwilioDbWriteFailure("voice_patient_write_table_missing", patientResult.error, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: effectivePhone ? (existingPatient ? "update" : "insert") : "skip",
        table: "patients",
      });
    } else {
      return { error: patientResult.error.message, lead, patient: null as null, transcript: transcript ?? null, workflow: null as null, urgency };
    }
  }
  const patient = patientResult.data ?? existingPatient ?? null;

  const workflowState = voiceWorkflowStateFromIntent(input.intent, input.details);
  const nextAction = buildVoiceNextAction(
    input.intent,
    input.details,
    "Capture the details and hand them to the reception team.",
  );
  const nextActionAt = input.details.breathingOrSwallowingIssue ? now : new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const existingWorkflow = await admin
    .from("recovery_workflows")
    .select("*")
    .eq("clinic_id", input.connection.clinic_id)
    .eq("call_id", input.call.id)
    .is("deleted_at", null)
    .maybeSingle<RecoveryWorkflow>();

  if (existingWorkflow.error) {
    if (isMissingRelationError(existingWorkflow.error)) {
      logTwilioDbWriteFailure("voice_workflow_table_missing", existingWorkflow.error, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: "select",
        table: "recovery_workflows",
      });
    } else {
      return { error: existingWorkflow.error.message, lead: lead ?? null, patient: patient ?? existingPatient ?? null, transcript: transcript ?? null, workflow: null as null, urgency };
    }
  }

  const workflowPayload = {
    assigned_user_id: input.connection.created_by,
    call_id: input.call.id,
    channel: "phone" as const,
    clinic_id: input.connection.clinic_id,
    current_step: input.details.breathingOrSwallowingIssue ? 2 : 1,
    lead_id: lead?.id ?? input.call.lead_id ?? null,
    max_steps: 3,
    next_action_at: nextActionAt,
    state: workflowState,
  };

  const workflowResult = existingWorkflow.data
    ? await admin
        .from("recovery_workflows")
        .update({
          ...workflowPayload,
          current_step: Math.max(existingWorkflow.data.current_step, workflowPayload.current_step),
        })
        .eq("id", existingWorkflow.data.id)
        .eq("clinic_id", input.connection.clinic_id)
        .select("*")
        .single<RecoveryWorkflow>()
    : await admin.from("recovery_workflows").insert(workflowPayload).select("*").single<RecoveryWorkflow>();

  if (workflowResult.error) {
    if (isMissingRelationError(workflowResult.error)) {
      logTwilioDbWriteFailure("voice_workflow_write_table_missing", workflowResult.error, {
        callSid: input.call.provider_call_id ?? input.call.id,
        clinicId: input.connection.clinic_id,
        operation: existingWorkflow.data ? "update" : "insert",
        table: "recovery_workflows",
      });
    } else {
      return {
        error: workflowResult.error.message,
        lead: lead ?? null,
        patient: patient ?? existingPatient ?? null,
        transcript: transcript ?? null,
        workflow: null as null,
        urgency,
      };
    }
  }

  const callStatus = input.details.breathingOrSwallowingIssue ? "answered" : "answered";
  const callRecoveryStatus = voiceRecoveryStatusFromIntent(input.intent, input.details);
  const { data: updatedCall, error: callUpdateError } = await admin
    .from("calls")
    .update({
      ended_at: null,
      lead_id: lead?.id ?? input.call.lead_id ?? null,
      recovery_next_action: nextAction,
      recovery_status: callRecoveryStatus,
      recovery_updated_at: now,
      status: callStatus,
      updated_at: now,
    })
    .eq("id", input.call.id)
    .eq("clinic_id", input.connection.clinic_id)
    .select("*")
    .single<Call>();

  if (callUpdateError) {
    return {
      error: callUpdateError.message,
      lead: lead ?? null,
      patient: patient ?? existingPatient ?? null,
      transcript: transcript ?? null,
      workflow: workflowResult.data ?? existingWorkflow.data ?? null,
      urgency,
    };
  }

  return {
    error: null,
    lead: lead ?? null,
    patient: patient ?? existingPatient ?? null,
    transcript: transcript ?? null,
    workflow: workflowResult.data ?? existingWorkflow.data ?? null,
    updatedCall: updatedCall ?? input.call,
    urgency,
  };
}

function detailsFollowUpAt(intent: VoiceIntent, details: VoiceCaptureDetails) {
  if (details.breathingOrSwallowingIssue || intent === "dental_emergency") {
    return new Date(Date.now() + 10 * 60 * 1000).toISOString();
  }

  if (intent === "complaint") {
    return new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  }

  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function voiceCompletionResponseText(input: {
  clinicName: string;
  details: VoiceCaptureDetails;
  intent: VoiceIntent;
  treatmentType: ReturnType<typeof classifyTreatmentType>;
}) {
  const clinicPrefix = `Thank you. I've made a note for ${input.clinicName}.`;

  if (input.details.breathingOrSwallowingIssue) {
    return `${clinicPrefix} Because you mentioned breathing or swallowing difficulty, this needs urgent emergency care now. One moment, and I'll connect you to the team immediately.`;
  }

  switch (input.intent) {
    case "dental_emergency":
      return `${clinicPrefix} This is marked as urgent, and the team will confirm the earliest emergency callback or slot.`;
    case "new_patient_appointment":
      return `${clinicPrefix} The team will confirm the appointment request and follow up with the next available step.`;
    case "existing_patient_appointment":
      return `${clinicPrefix} The team will review your details and confirm the best appointment option.`;
    case "cancellation_reschedule":
      return `${clinicPrefix} The team will confirm the cancellation or reschedule request.`;
    case "treatment_enquiry":
      return `${clinicPrefix} Your ${treatmentLabel(input.treatmentType).toLowerCase()} enquiry has been noted, and the team will arrange the next step.`;
    case "pricing_enquiry":
      return `${clinicPrefix} Prices vary depending on clinical assessment, and the team will contact you with the right options.`;
    case "complaint":
      return `I'm sorry about that. I've made a note for ${input.clinicName}. The practice manager will review it and call you back.`;
    case "message_for_reception":
      return `${clinicPrefix} I'll pass your message to reception and the team will follow up.`;
    default:
      return `${clinicPrefix} The team will review the message and confirm the next step.`;
  }
}

export async function handleTwilioVoiceWebhook(request: NextRequest) {
  const auth = await authenticateTwilioWebhook(request, "voice");
  if (!auth.ok) {
    return auth.errorResponse;
  }

  const { connection, payload, testMode } = auth;
  const receivedAt = new Date().toISOString();
  const eventId = payload.CallSid || payload.MessageSid || payload.RecordingSid || `voice-${connection.clinic_id}-${Date.now().toString(36)}`;
  const clinicName = await getClinicName(connection.clinic_id);
  const baseUrl = buildWebhookBaseUrl(request);
  const speechUrl = `${baseUrl}/api/webhooks/twilio/voice/speech`;
  const callerId = connection.voice_number || payload.To || payload.Called || "";
  const forwardToNumber = connection.forward_to_number || "";

  await recordWebhookEvent({
    clinicId: connection.clinic_id,
    eventType: "twilio.voice.received",
    idempotencyKey: eventId,
    payload,
    processingStatus: "received",
    providerEventId: payload.CallSid ?? null,
    receivedAt,
  });
  const result = await processTwilioCallWebhook(
    {
      ...payload,
      CallStatus: payload.CallStatus || "in-progress",
      Direction: payload.Direction || "inbound",
      To: payload.To || connection.voice_number,
      Called: payload.Called || connection.voice_number,
      From: payload.From || "",
    },
    { refreshSummary: false },
  );
  if (!result.ok || !("call" in result) || !result.call) {
    logTwilioError("voice_failed", result.error ?? "Twilio voice webhook failed", {
      callSid: payload.CallSid,
      clinicId: connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: connection.clinic_id,
      errorMessage: result.error ?? "Twilio voice webhook failed",
      eventType: "twilio.voice.failed",
      idempotencyKey: eventId,
      payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: payload.CallSid ?? null,
      receivedAt,
    });
    return new Response(
      buildVoiceFailureTwiml({
        clinicName,
        callerId,
        forwardToNumber,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "false",
          "X-ClinicFlow-Test-Mode": String(testMode),
        },
        status: 200,
      },
    );
  }

  logTwilioEvent("voice_processed", {
    callSid: result.call.provider_call_id ?? payload.CallSid,
    clinicId: connection.clinic_id,
    hasSpeech: Boolean(payload.SpeechResult?.trim()),
    hasDigits: Boolean(payload.Digits?.trim()),
    status: result.call.status,
  });
  await recordWebhookEvent({
    clinicId: connection.clinic_id,
    eventType: "twilio.voice.processed",
    idempotencyKey: eventId,
    payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: payload.CallSid ?? null,
    receivedAt,
  });

  const voiceWorkflowNextAction = "Await the caller's reason for calling.";
  const voiceWorkflowState = "drafted" as const;
  const voiceWorkflowResult = await createSupabaseAdminClient()
    .from("recovery_workflows")
    .select("*")
    .eq("clinic_id", connection.clinic_id)
    .eq("call_id", result.call.id)
    .is("deleted_at", null)
    .maybeSingle<RecoveryWorkflow>();

  if (voiceWorkflowResult.error) {
    logTwilioError("voice_workflow_lookup_failed", voiceWorkflowResult.error, {
      callSid: result.call.provider_call_id ?? payload.CallSid,
      clinicId: connection.clinic_id,
    });
  }

  const voiceWorkflowPayload = {
    assigned_user_id: connection.created_by,
    call_id: result.call.id,
    channel: "phone" as const,
    clinic_id: connection.clinic_id,
    current_step: 1,
    lead_id: result.call.lead_id ?? null,
    max_steps: 3,
    next_action_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    state: voiceWorkflowState,
  };

  if (voiceWorkflowResult.data) {
    await createSupabaseAdminClient()
      .from("recovery_workflows")
      .update({
        ...voiceWorkflowPayload,
        current_step: Math.max(voiceWorkflowResult.data.current_step, voiceWorkflowPayload.current_step),
      })
      .eq("id", voiceWorkflowResult.data.id)
      .eq("clinic_id", connection.clinic_id);
  } else {
    await createSupabaseAdminClient().from("recovery_workflows").insert(voiceWorkflowPayload);
  }

  await createSupabaseAdminClient()
    .from("calls")
    .update({
      recovery_next_action: voiceWorkflowNextAction,
      recovery_status: voiceWorkflowState,
      recovery_updated_at: new Date().toISOString(),
      status: "answered",
      updated_at: new Date().toISOString(),
    })
    .eq("id", result.call.id)
    .eq("clinic_id", connection.clinic_id);

  return new Response(
    buildVoiceGreetingTwiml({
      clinicName,
      callerId,
      forwardToNumber,
      speechUrl,
    }),
    {
      headers: {
        "Content-Type": "text/xml",
        "X-ClinicFlow-Processed": String(result.ok),
        "X-ClinicFlow-Test-Mode": String(testMode),
      },
      status: 200,
    },
  );
}

export async function handleTwilioVoiceSpeechWebhook(request: NextRequest) {
  const auth = await authenticateTwilioWebhook(request, "speech");
  if (!auth.ok) {
    return auth.errorResponse;
  }

  const receivedAt = new Date().toISOString();
  const eventId = auth.payload.CallSid || auth.payload.MessageSid || `speech-${auth.connection.clinic_id}-${Date.now().toString(36)}`;
  const clinicName = await getClinicName(auth.connection.clinic_id);
  const callerId = auth.connection.voice_number || auth.payload.To || auth.payload.Called || "";
  const forwardToNumber = auth.connection.forward_to_number || "";
  const speechText = (auth.payload.SpeechResult || auth.payload.TranscriptionText || auth.payload.Digits || "").trim();
  const stage = new URL(request.url).searchParams.get("stage") ?? "triage";
  const stageEventId = `${eventId}-${stage}`;

  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.voice_speech.received",
    idempotencyKey: stageEventId,
    payload: auth.payload,
    processingStatus: "received",
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  if (!speechText) {
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      eventType: "twilio.voice_speech.empty",
      idempotencyKey: `${stageEventId}-empty`,
      payload: auth.payload,
      processingStatus: "ignored",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });

    return new Response(
      buildVoiceFallbackTwiml({
        clinicName,
        callerId,
        forwardToNumber,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "false",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  const intent = classifyVoiceIntent(speechText);
  const treatmentType = classifyTreatmentType(speechText);
  const details = extractVoiceCaptureDetails(speechText);

  if (details.wantsHuman) {
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      eventType: "twilio.voice_speech.forwarded",
      idempotencyKey: `${stageEventId}-human`,
      payload: auth.payload,
      processingStatus: "ignored",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });

    return new Response(buildVoiceFallbackTwiml({ clinicName, callerId, forwardToNumber }), {
      headers: {
        "Content-Type": "text/xml",
        "X-ClinicFlow-Processed": "false",
        "X-ClinicFlow-Test-Mode": String(auth.testMode),
      },
      status: 200,
    });
  }

  const processingResult = await processTwilioCallWebhook(
    {
      ...auth.payload,
      CallStatus: auth.payload.CallStatus || "in-progress",
      Direction: auth.payload.Direction || "inbound",
      To: auth.payload.To || auth.connection.voice_number,
      Called: auth.payload.Called || auth.connection.voice_number,
      From: auth.payload.From || "",
    },
    { refreshSummary: false },
  );

  if (!processingResult.ok || !("call" in processingResult) || !processingResult.call) {
    logTwilioError("voice_speech_failed", processingResult.error ?? "Twilio speech webhook failed", {
      callSid: auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: processingResult.error ?? "Twilio speech webhook failed",
      eventType: "twilio.voice_speech.failed",
      idempotencyKey: `${stageEventId}-failed`,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });
    return new Response(
      buildVoiceFailureTwiml({
        clinicName,
        callerId,
        forwardToNumber,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "false",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  const artifactResult = await upsertVoiceTriageArtifacts({
    call: processingResult.call,
    callerNumber: auth.payload.From || null,
    clinicName: clinicName ?? "ClinicFlow clinic",
    connection: auth.connection,
    details,
    intent,
    stage: stage === "collect-details" ? "collect-details" : "triage",
    speechText,
    treatmentType,
  });

  if (artifactResult.error || !artifactResult.updatedCall) {
    const errorMessage = artifactResult.error ?? "Unable to store the voice triage details.";
    logTwilioError("voice_triage_failed", errorMessage, {
      callSid: processingResult.call.provider_call_id ?? auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
      intent,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage,
      eventType: "twilio.voice_speech.failed",
      idempotencyKey: `${stageEventId}-triage`,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });
    return new Response(
      buildVoiceFallbackTwiml({
        clinicName,
        callerId,
        forwardToNumber,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "false",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  const summaryRefresh = await refreshCallReceptionSummary({
    call: artifactResult.updatedCall,
    clinicName: clinicName ?? "ClinicFlow clinic",
    connection: auth.connection,
    lead: artifactResult.lead ?? null,
  });

  if (summaryRefresh.error || !summaryRefresh.summary) {
    logTwilioError("voice_speech_summary_failed", summaryRefresh.error ?? "Missing AI summary for speech webhook", {
      callSid: artifactResult.updatedCall.provider_call_id ?? auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: summaryRefresh.error ?? "Missing AI summary for speech webhook",
      eventType: "twilio.voice_speech.failed",
      idempotencyKey: `${stageEventId}-summary`,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });
    return new Response(
      buildVoiceFailureTwiml({
        clinicName,
        callerId,
        forwardToNumber,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "false",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  const nextPrompt = buildVoiceFollowUpPrompt(intent);
  const followUpResponseText =
    stage === "collect-details"
      ? voiceCompletionResponseText({
          clinicName: clinicName ?? "ClinicFlow clinic",
          details,
          intent,
          treatmentType,
        })
      : nextPrompt;

  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: stage === "collect-details" ? "twilio.voice_speech.completed" : "twilio.voice_speech.triaged",
    idempotencyKey: stageEventId,
    payload: auth.payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  if (details.breathingOrSwallowingIssue) {
    return new Response(
      buildVoiceEmergencyTransferTwiml({
        clinicName,
        callerId,
        forwardToNumber,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "true",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  if (stage !== "collect-details" && !details.breathingOrSwallowingIssue) {
    const followUpUrl = `${buildWebhookBaseUrl(request)}/api/webhooks/twilio/voice/speech?stage=collect-details`;
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${followUpUrl}" input="speech" method="POST" speechTimeout="auto" timeout="6">
    ${buildSayTwiml(followUpResponseText)}
  </Gather>
  ${buildSayTwiml("One moment, and I will put you through to the team now.")}
  <Dial callerId="${escapeXml(callerId)}" timeout="20">
    <Number>${escapeXml(forwardToNumber)}</Number>
  </Dial>
</Response>`,
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Processed": "true",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  return new Response(
    buildVoiceFollowUpTwiml({
      clinicName,
      responseText: followUpResponseText,
    }),
    {
      headers: {
        "Content-Type": "text/xml",
        "X-ClinicFlow-Processed": "true",
        "X-ClinicFlow-Test-Mode": String(auth.testMode),
      },
      status: 200,
    },
  );
}

export async function handleTwilioStatusWebhook(request: NextRequest) {
  const auth = await authenticateTwilioWebhook(request, "status");
  if (!auth.ok) {
    return auth.errorResponse;
  }

  const receivedAt = new Date().toISOString();
  const eventId = auth.payload.CallSid || auth.payload.MessageSid || `status-${auth.connection.clinic_id}-${Date.now().toString(36)}`;
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.status.received",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "received",
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  const result = await processTwilioCallWebhook(auth.payload);
  if (!result.ok || !("call" in result) || !result.call) {
    logTwilioError("status_failed", result.error ?? "Twilio status webhook failed", {
      callSid: auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: result.error ?? "Twilio status webhook failed",
      eventType: "twilio.status.failed",
      idempotencyKey: eventId,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });
    return buildWebhookErrorResponse(result.error ?? "Twilio status webhook failed.", auth.testMode ? 200 : 500);
  }

  logTwilioEvent("status_processed", {
    callSid: result.call.provider_call_id ?? auth.payload.CallSid,
    clinicId: auth.connection.clinic_id,
    recoveryStatus: result.call.recovery_status,
    status: result.call.status,
  });
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.status.processed",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  return Response.json(
    {
      callStatus: result.call.status,
      ok: true,
      recoveryStatus: result.call.recovery_status,
    },
    {
      headers: {
        "X-ClinicFlow-Test-Mode": String(auth.testMode),
      },
    },
  );
}

export async function handleTwilioMissedCallWebhook(request: NextRequest) {
  const auth = await authenticateTwilioWebhook(request, "missed-call");
  if (!auth.ok) {
    return auth.errorResponse;
  }

  const receivedAt = new Date().toISOString();
  const eventId = auth.payload.CallSid || `missed-call-${auth.connection.clinic_id}-${Date.now().toString(36)}`;
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.missed_call.received",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "received",
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  const result = await processTwilioCallWebhook({
    ...auth.payload,
    AnsweredBy: auth.payload.AnsweredBy || "",
    CallStatus: auth.payload.CallStatus || "no-answer",
  });

  if (!result.ok || !("call" in result) || !result.call) {
    logTwilioError("missed_call_failed", result.error ?? "Twilio missed-call webhook failed", {
      callSid: auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: result.error ?? "Twilio missed-call webhook failed",
      eventType: "twilio.missed_call.failed",
      idempotencyKey: eventId,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.CallSid ?? null,
      receivedAt,
    });
    return buildWebhookErrorResponse(result.error ?? "Twilio missed-call webhook failed.", auth.testMode ? 200 : 500);
  }

  logTwilioEvent("missed_call_processed", {
    callSid: result.call.provider_call_id ?? auth.payload.CallSid,
    clinicId: auth.connection.clinic_id,
    recoveryStatus: result.call.recovery_status,
    status: result.call.status,
  });
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.missed_call.processed",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  return Response.json(
    {
      ok: true,
      recoveryStatus: result.call.recovery_status,
    },
    {
      headers: {
        "X-ClinicFlow-Test-Mode": String(auth.testMode),
      },
    },
  );
}

export async function handleTwilioSmsWebhook(request: NextRequest) {
  const auth = await authenticateTwilioWebhook(request, "sms");
  if (!auth.ok) {
    return auth.errorResponse;
  }

  const receivedAt = new Date().toISOString();
  const eventId = auth.payload.MessageSid || `sms-${auth.connection.clinic_id}-${Date.now().toString(36)}`;
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.sms.received",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "received",
    providerEventId: auth.payload.MessageSid ?? null,
    receivedAt,
  });

  const result = await processTwilioSmsWebhook(auth.payload);
  if (!result.ok) {
    logTwilioError("sms_failed", result.error ?? "Twilio SMS webhook failed", {
      clinicId: auth.connection.clinic_id,
      messageSid: auth.payload.MessageSid,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: result.error ?? "Twilio SMS webhook failed",
      eventType: "twilio.sms.failed",
      idempotencyKey: eventId,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.MessageSid ?? null,
      receivedAt,
    });
    return buildWebhookErrorResponse(result.error ?? "Twilio SMS webhook failed.", auth.testMode ? 200 : 500);
  }

  logTwilioEvent("sms_processed", {
    clinicId: auth.connection.clinic_id,
    messageSid: auth.payload.MessageSid,
    replyState: result.replyState,
  });
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.sms.processed",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: auth.payload.MessageSid ?? null,
    receivedAt,
  });

  return Response.json(
    {
      ok: true,
      replyState: result.replyState,
    },
    {
      headers: {
        "X-ClinicFlow-Test-Mode": String(auth.testMode),
      },
    },
  );
}

export async function handleTwilioVoicemailWebhook(request: NextRequest) {
  const auth = await authenticateTwilioWebhook(request, "voicemail");
  if (!auth.ok) {
    return auth.errorResponse;
  }

  const receivedAt = new Date().toISOString();
  const eventId = auth.payload.RecordingSid || auth.payload.CallSid || `voicemail-${auth.connection.clinic_id}-${Date.now().toString(36)}`;
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.voicemail.received",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "received",
    providerEventId: auth.payload.RecordingSid || auth.payload.CallSid || null,
    receivedAt,
  });

  const hasRecording = Boolean(auth.payload.RecordingSid?.trim() && auth.payload.RecordingUrl?.trim());

  if (!hasRecording) {
    const voiceUrl = `${buildWebhookBaseUrl(request)}/api/twilio/voice`;
    const voicemailUrl = `${buildWebhookBaseUrl(request)}/api/twilio/voicemail`;
    const clinicName = await getClinicName(auth.connection.clinic_id);
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      eventType: "twilio.voicemail.processed",
      idempotencyKey: eventId,
      payload: auth.payload,
      processingStatus: "processed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.RecordingSid || auth.payload.CallSid || null,
      receivedAt,
    });

    return new Response(
      buildVoicemailPromptTwiml({
        clinicName,
        voicemailUrl,
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
          "X-ClinicFlow-Voice-Url": voiceUrl,
        },
        status: 200,
      },
    );
  }

  const followUpResult = await processTwilioCallWebhook(followUpPayloadFromVoicemail(auth.payload));
  if (!followUpResult.ok || !("call" in followUpResult) || !followUpResult.call) {
    logTwilioError("voicemail_context_failed", followUpResult.error ?? "Unable to persist voicemail call context", {
      callSid: auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: followUpResult.error ?? "Unable to persist voicemail call context",
      eventType: "twilio.voicemail.failed",
      idempotencyKey: eventId,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.RecordingSid || auth.payload.CallSid || null,
      receivedAt,
    });
    return new Response(
      buildVoicemailFailureTwiml({
        clinicName: await getClinicName(auth.connection.clinic_id),
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  const artifacts = await storeVoicemailArtifacts({
    call: followUpResult.call,
    connection: auth.connection,
    payload: auth.payload,
  });

  if (artifacts.error) {
    logTwilioError("voicemail_persist_failed", artifacts.error, {
      callSid: auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: artifacts.error,
      eventType: "twilio.voicemail.failed",
      idempotencyKey: eventId,
      payload: auth.payload,
      processingStatus: "failed",
      processedAt: new Date().toISOString(),
      providerEventId: auth.payload.RecordingSid || auth.payload.CallSid || null,
      receivedAt,
    });
    return new Response(
      buildVoicemailFailureTwiml({
        clinicName: await getClinicName(auth.connection.clinic_id),
      }),
      {
        headers: {
          "Content-Type": "text/xml",
          "X-ClinicFlow-Test-Mode": String(auth.testMode),
        },
        status: 200,
      },
    );
  }

  logTwilioEvent("voicemail_processed", {
    clinicId: auth.connection.clinic_id,
    callSid: followUpResult.call.provider_call_id ?? auth.payload.CallSid,
    voicemailId: artifacts.voicemail?.id,
    transcriptId: artifacts.transcript?.id,
  });
  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.voicemail.processed",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: auth.payload.RecordingSid || auth.payload.CallSid || null,
    receivedAt,
  });

  const clinicName = await getClinicName(auth.connection.clinic_id);
  const summaryRefresh = await refreshCallReceptionSummary({
    call: followUpResult.call,
    clinicName,
    connection: auth.connection,
    lead: null,
  });

  if (summaryRefresh.error) {
    logTwilioError("voicemail_summary_failed", summaryRefresh.error, {
      callSid: followUpResult.call.provider_call_id ?? auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
  }

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${buildSayTwiml("Thanks. I've logged your voicemail and the team will review it shortly.")}</Response>`,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-ClinicFlow-Test-Mode": String(auth.testMode),
        "X-ClinicFlow-Voicemail-Id": artifacts.voicemail?.id ?? "",
      },
      status: 200,
    },
  );
}

function isMissingRelationError(error: { code?: string | null; message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

function formatVoicemailLabel(voicemail: VoicemailMessage) {
  return voicemail.summary?.trim() || voicemail.transcript_text?.trim() || "Voicemail recorded";
}

function formatSmsConversationLabel(event: SmsEvent) {
  return event.body_preview?.trim() || event.provider_message_id || "SMS event";
}

export async function getTwilioOperationsDashboardData(clinicId: string): Promise<TwilioOperationsDashboardData> {
  const admin = createSupabaseAdminClient();
  const warnings: string[] = [];
  const fatalErrors: string[] = [];

  const [
    { data: activeCalls, error: activeCallsError },
    { data: recentCalls, error: recentCallsError },
    { data: missedCalls, error: missedCallsError },
    { data: smsEvents, error: smsEventsError },
    { data: voicemails, error: voicemailsError },
    { data: recordings, error: recordingsError },
    { data: transcripts, error: transcriptsError },
  ] = await Promise.all([
    admin.from("calls").select("*").eq("clinic_id", clinicId).is("deleted_at", null).in("status", ["queued", "answered"]).order("updated_at", { ascending: false }).limit(10).returns<Call[]>(),
    admin.from("calls").select("*").eq("clinic_id", clinicId).is("deleted_at", null).order("started_at", { ascending: false }).limit(10).returns<Call[]>(),
    admin.from("calls").select("*").eq("clinic_id", clinicId).is("deleted_at", null).in("status", ["missed", "voicemail", "abandoned"]).order("started_at", { ascending: false }).limit(10).returns<Call[]>(),
    admin.from("sms_events").select("*").eq("clinic_id", clinicId).order("occurred_at", { ascending: false }).limit(12).returns<SmsEvent[]>(),
    admin.from("voicemail_messages").select("*").eq("clinic_id", clinicId).is("deleted_at", null).order("created_at", { ascending: false }).limit(12).returns<VoicemailMessage[]>(),
    admin.from("call_recordings").select("*").eq("clinic_id", clinicId).is("deleted_at", null).order("created_at", { ascending: false }).limit(12).returns<CallRecording[]>(),
    admin.from("call_transcripts").select("*").eq("clinic_id", clinicId).is("deleted_at", null).order("created_at", { ascending: false }).limit(12).returns<CallTranscript[]>(),
  ]);

  const errors = [activeCallsError, recentCallsError, missedCallsError, smsEventsError, voicemailsError, recordingsError, transcriptsError].filter(Boolean);
  if (errors.length > 0) {
    for (const error of errors) {
      if (isMissingRelationError(error)) {
        warnings.push(error?.message ?? "Missing Twilio media table.");
      } else {
        fatalErrors.push(error?.message ?? "Some Twilio dashboard tables could not be loaded.");
      }
    }
  }

  const cleanWarnings = Array.from(new Set(warnings));
  const activeCallList = activeCalls ?? [];
  const missedCallList = missedCalls ?? [];
  const smsList = smsEvents ?? [];
  const voicemailList = voicemails ?? [];
  const recordingList = recordings ?? [];
  const transcriptList = transcripts ?? [];

  return {
    activeCalls: activeCallList,
    error: fatalErrors[0] ?? null,
    missedCalls: missedCallList,
    recordings: recordingList,
    recentCalls: recentCalls ?? [],
    smsConversations: smsList,
    transcripts: transcriptList,
    voicemails: voicemailList,
    warnings: cleanWarnings,
  };
}

export function summarizeTwilioVoicemail(voicemail: VoicemailMessage) {
  return formatVoicemailLabel(voicemail);
}

export function summarizeTwilioSms(event: SmsEvent) {
  return formatSmsConversationLabel(event);
}

export type TwilioVoiceReceptionPlan = {
  clinicName: string;
  followUpPrompt: string;
  voicemailPrompt: string;
};

export function buildTwilioVoiceReceptionPlan(clinicName: string): TwilioVoiceReceptionPlan {
  return {
    clinicName,
    followUpPrompt: `Thanks for calling ${clinicName}. I've made a note and the team will take it from here.`,
    voicemailPrompt: `Please leave your name and number for ${clinicName} after the tone.`,
  };
}

export function buildTwilioWebhookBaseUrl(request: Request) {
  return buildWebhookBaseUrl(request);
}

export async function storeTwilioSpeechCapture(input: {
  call: Call;
  connection: TwilioConnection;
  payload: TwilioExtendedWebhookPayload;
}) {
  return storeSpeechTranscript({
    call: input.call,
    connection: input.connection,
    payload: input.payload,
    source: "speech",
  });
}

export async function storeTwilioVoicemailCapture(input: {
  call: Call;
  connection: TwilioConnection;
  payload: TwilioExtendedWebhookPayload;
}) {
  return storeVoicemailArtifacts(input);
}
