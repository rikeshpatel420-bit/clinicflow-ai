import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Call, CallRecording, CallTranscript, Json, SmsEvent, TwilioConnection, VoicemailMessage } from "@/types/database";
import { getTwilioConnectionForClinic, getTwilioConnectionForVoiceNumber, resolveTwilioSignatureAuthToken } from "./config";
import { parseTwilioFormData, type TwilioWebhookPayload } from "./missed-call";
import { processTwilioCallWebhook, processTwilioSmsWebhook, refreshCallReceptionSummary } from "./recovery";
import { resolveTwilioPublicOrigin, verifyTwilioSignature, type TwilioWebhookType } from "./verification";
import type { NextRequest } from "next/server";

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

function buildWebhookBaseUrl(request: Request) {
  return resolveTwilioPublicOrigin(request as NextRequest);
}

function buildInvalidVoiceTwiml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, ClinicFlow could not verify this call right now. Please try again shortly.</Say>
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

function truncateForSpeech(value: string, maxLength = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function buildVoiceFallbackTwiml(input: { clinicName: string; callerId: string; forwardToNumber: string }) {
  const clinicName = escapeXml(input.clinicName);
  const callerId = escapeXml(input.callerId);
  const forwardToNumber = escapeXml(input.forwardToNumber);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, ClinicFlow is having trouble right now for ${clinicName}. I'm connecting you to the team.</Say>
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
    <Say voice="alice">Thanks for calling ${clinicName}. This is ClinicFlow AI. Please tell me the reason for your call after the beep.</Say>
  </Gather>
  <Say voice="alice">Sorry, I could not hear a response. I'm connecting you to the team now.</Say>
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
  <Say voice="alice">${responseText || `Thanks. We have logged your message for ${clinicName} and a member of the team will follow up shortly.`}</Say>
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

function buildVoicemailPromptTwiml(input: { clinicName: string; voicemailUrl: string }) {
  const clinicName = escapeXml(input.clinicName);
  const voicemailUrl = escapeXml(input.voicemailUrl);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Please leave a message for ${clinicName} after the tone.</Say>
  <Record action="${voicemailUrl}" method="POST" maxLength="120" playBeep="true" timeout="5" transcribeCallback="${voicemailUrl}" trim="trim-silence" />
  <Say voice="alice">We did not receive a message.</Say>
</Response>`;
}

function buildVoicemailFailureTwiml(input: { clinicName: string }) {
  const clinicName = escapeXml(input.clinicName);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, ClinicFlow could not finish recording ${clinicName} right now. Please try again shortly.</Say>
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
    logTwilioError("webhook_event_record_failed", error, {
      clinicId: input.clinicId,
      eventType: input.eventType,
      idempotencyKey: input.idempotencyKey,
      processingStatus: input.processingStatus,
      providerEventId: input.providerEventId,
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
      return { error: error.message, recording: null, transcript: null, voicemail: null };
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
    return { error: voicemailError.message, recording, transcript: null, voicemail: null };
  }

  const transcript = transcriptText
    ? (
        await admin
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
          .single<CallTranscript>()
      ).data ?? null
    : null;

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

function buildSpeechResponseText(input: {
  clinicName: string;
  summary: Awaited<ReturnType<typeof refreshCallReceptionSummary>>["summary"] | null;
}) {
  const clinicPrefix = input.clinicName.trim() ? `Thanks for calling ${input.clinicName}.` : "Thanks for calling.";
  const summaryText = input.summary
    ? truncateForSpeech(
        [input.summary.patientSummary, input.summary.followUpRecommendation]
          .filter(Boolean)
          .join(" "),
      )
    : "";

  return truncateForSpeech([clinicPrefix, summaryText || "I've logged your call and the team will follow up shortly."].filter(Boolean).join(" "));
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

  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.voice_speech.received",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "received",
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  if (!speechText) {
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      eventType: "twilio.voice_speech.empty",
      idempotencyKey: `${eventId}-empty`,
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
      idempotencyKey: eventId,
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

  const transcriptResult = await storeTwilioSpeechCapture({
    call: processingResult.call,
    connection: auth.connection,
    payload: auth.payload,
  });

  if (transcriptResult.error) {
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: transcriptResult.error,
      eventType: "twilio.voice_speech.failed",
      idempotencyKey: `${eventId}-transcript`,
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

  const summaryRefresh = await refreshCallReceptionSummary({
    call: processingResult.call,
    clinicName: clinicName ?? "ClinicFlow clinic",
    connection: auth.connection,
    lead: processingResult.lead ?? null,
  });

  if (summaryRefresh.error || !summaryRefresh.summary) {
    logTwilioError("voice_speech_summary_failed", summaryRefresh.error ?? "Missing AI summary for speech webhook", {
      callSid: processingResult.call.provider_call_id ?? auth.payload.CallSid,
      clinicId: auth.connection.clinic_id,
    });
    await recordWebhookEvent({
      clinicId: auth.connection.clinic_id,
      errorMessage: summaryRefresh.error ?? "Missing AI summary for speech webhook",
      eventType: "twilio.voice_speech.failed",
      idempotencyKey: `${eventId}-summary`,
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

  const responseText = buildSpeechResponseText({
    clinicName,
    summary: summaryRefresh.summary,
  });

  await recordWebhookEvent({
    clinicId: auth.connection.clinic_id,
    eventType: "twilio.voice_speech.processed",
    idempotencyKey: eventId,
    payload: auth.payload,
    processingStatus: "processed",
    processedAt: new Date().toISOString(),
    providerEventId: auth.payload.CallSid ?? null,
    receivedAt,
  });

  return new Response(
    buildVoiceFollowUpTwiml({
      clinicName,
      responseText,
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
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thanks. We have logged your voicemail.</Say></Response>`,
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
    followUpPrompt: `Thanks for calling ${clinicName}. We have logged your call and are preparing the right follow-up.`,
    voicemailPrompt: `Please leave a voicemail for ${clinicName} after the tone.`,
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
