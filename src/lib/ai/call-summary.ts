import { createHash } from "node:crypto";
import { getActiveFlowPlatformProfile } from "@/lib/flow-platform";
import type { Call, CallTranscript, PatientLead, SmsEvent, VoicemailMessage } from "@/types/database";
import { getBackendEnv } from "@/lib/backend/env";
import { classifyIntent, recommendNextAction, scoreLead, type EnquiryCategory } from "@/lib/ai/logic";

export type CallReceptionSummary = {
  appointmentRecommendation: string;
  clinicalSummary: string;
  followUpRecommendation: string;
  patientSummary: string;
  responseTone: "warm_professional" | "urgent_callback" | "booking_focused";
  receptionNotes: string;
  urgencyScore: number;
};

export function parseCallReceptionSummary(value: unknown): CallReceptionSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Record<keyof CallReceptionSummary, unknown>>;
  if (
    typeof candidate.appointmentRecommendation !== "string" ||
    typeof candidate.clinicalSummary !== "string" ||
    typeof candidate.followUpRecommendation !== "string" ||
    typeof candidate.patientSummary !== "string" ||
    typeof candidate.receptionNotes !== "string" ||
    typeof candidate.responseTone !== "string" ||
    typeof candidate.urgencyScore !== "number"
  ) {
    return null;
  }

  if (!["warm_professional", "urgent_callback", "booking_focused"].includes(candidate.responseTone)) {
    return null;
  }

  return {
    appointmentRecommendation: candidate.appointmentRecommendation,
    clinicalSummary: candidate.clinicalSummary,
    followUpRecommendation: candidate.followUpRecommendation,
    patientSummary: candidate.patientSummary,
    receptionNotes: candidate.receptionNotes,
    responseTone: candidate.responseTone as CallReceptionSummary["responseTone"],
    urgencyScore: candidate.urgencyScore,
  };
}

export type CallReceptionSummaryContext = {
  call: Pick<Call, "id" | "clinic_id" | "caller_number_last4" | "direction" | "status" | "recovery_status" | "recovery_next_action" | "provider_call_id" | "started_at" | "ended_at" | "created_at" | "updated_at" | "lead_id">;
  clinicName: string;
  lead: Pick<PatientLead, "enquiry_summary" | "estimated_value_pence" | "lead_score" | "priority" | "source" | "status" | "updated_at"> | null;
  transcript: Pick<CallTranscript, "summary" | "transcript_text" | "updated_at"> | null;
  voicemail: Pick<VoicemailMessage, "summary" | "transcript_text" | "updated_at"> | null;
  smsEvents: Pick<SmsEvent, "body_preview" | "direction" | "status" | "occurred_at">[];
};

type OpenAiSummaryResponse = {
  appointment_recommendation: string;
  clinical_summary: string;
  follow_up_recommendation: string;
  patient_summary: string;
  response_tone: CallReceptionSummary["responseTone"];
  reception_notes: string;
  urgency_score: number;
};

function safeText(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  return text ? text : fallback;
}

function extractKeywords(text: string) {
  const lower = text.toLowerCase();
  return ["emergency", "pain", "swelling", "implant", "invisalign", "hygiene", "toothache", "broken tooth", "extraction"].filter((keyword) =>
    lower.includes(keyword),
  );
}

function buildSourceText(input: CallReceptionSummaryContext) {
  const parts = [
    `Clinic: ${input.clinicName}.`,
    `Call status: ${input.call.status}. Recovery state: ${input.call.recovery_status}.`,
    input.call.caller_number_last4 ? `Caller ending ${input.call.caller_number_last4}.` : null,
    input.lead?.enquiry_summary ? `Lead summary: ${input.lead.enquiry_summary}.` : null,
    input.transcript?.transcript_text ? `Transcript: ${input.transcript.transcript_text}.` : null,
    input.transcript?.summary ? `Transcript summary: ${input.transcript.summary}.` : null,
    input.voicemail?.transcript_text ? `Voicemail: ${input.voicemail.transcript_text}.` : null,
    input.voicemail?.summary ? `Voicemail summary: ${input.voicemail.summary}.` : null,
    input.smsEvents.length > 0
      ? `SMS thread: ${input.smsEvents
          .slice(0, 6)
          .map((event) => `${event.direction}:${event.status}:${event.body_preview ?? ""}`.trim())
          .join(" | ")}.`
      : null,
  ].filter(Boolean);

  return parts.join(" ");
}

function deriveCategory(input: CallReceptionSummaryContext): EnquiryCategory {
  const sourceText = buildSourceText(input);
  return classifyIntent(sourceText);
}

function deriveUrgencyScore(input: CallReceptionSummaryContext, category: EnquiryCategory) {
  const sourceText = buildSourceText(input);
  const leadScore = input.lead?.lead_score ?? 0;
  const minutesSinceContact = input.call.started_at ? Math.max(0, Math.round((Date.now() - new Date(input.call.started_at).getTime()) / 60000)) : 0;
  const estimatedValue = input.lead?.estimated_value_pence ?? 0;
  const base = scoreLead(category, minutesSinceContact, estimatedValue);
  const emergencyBonus = extractKeywords(sourceText).some((keyword) => ["emergency", "pain", "swelling", "toothache", "broken tooth"].includes(keyword)) ? 10 : 0;
  return Math.min(100, Math.max(base, leadScore) + emergencyBonus);
}

function deriveResponseTone(category: EnquiryCategory, urgencyScore: number): CallReceptionSummary["responseTone"] {
  if (category === "emergency" || urgencyScore >= 90) return "urgent_callback";
  if (category === "implant_consult" || category === "hygiene_recall" || category === "new_patient") return "booking_focused";
  return "warm_professional";
}

function deriveSummaryFromContext(input: CallReceptionSummaryContext): CallReceptionSummary {
  const category = deriveCategory(input);
  const urgencyScore = deriveUrgencyScore(input, category);
  const sourceText = buildSourceText(input);
  const keywords = extractKeywords(sourceText);
  const responseTone = deriveResponseTone(category, urgencyScore);
  const templates = activeFlowPlatformProfile.conversation.leads.summaryTemplates;
  const appointmentRecommendation =
    category === "emergency"
      ? templates.appointmentRecommendation
      : category === "implant_consult"
        ? "Offer a consultation slot and capture the patient's preferred timing."
        : category === "hygiene_recall"
          ? "Offer the next hygiene availability and keep the reactivation warm."
          : templates.appointmentRecommendation;

  return {
    appointmentRecommendation,
    clinicalSummary:
      category === "emergency"
        ? "Urgent clinical triage required before routine admin follow-up."
        : keywords.length > 0
          ? `Keywords detected: ${keywords.join(", ")}. Review for clinical priority before routine follow-up.`
          : templates.caseSummary ?? templates.clinicalSummary ?? "Continue standard triage.",
    followUpRecommendation:
      input.call.recovery_status === "lost"
        ? "Respect the opt-out, close the thread, and avoid further SMS follow-up."
        : input.call.recovery_status === "booked"
          ? "Confirm the booking and send any final appointment details."
          : recommendNextAction(category, urgencyScore) || templates.followUpRecommendation,
    patientSummary: safeText(input.transcript?.summary ?? input.voicemail?.summary ?? input.lead?.enquiry_summary, templates.patientSummary),
    responseTone,
    receptionNotes:
      input.call.status === "missed"
        ? templates.receptionNotes
        : input.call.status === "voicemail"
          ? "Voicemail captured. Call back promptly and keep the handover concise."
          : "Call logged. Keep the follow-up structured and clinic-safe.",
    urgencyScore,
  };
}

async function requestOpenAiSummary(input: CallReceptionSummaryContext): Promise<CallReceptionSummary | null> {
  const env = getBackendEnv();
  if (!env.openaiApiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content: `You are ${activeFlowPlatformProfile.industry.name} Flow AI summarising a live call.\nReturn concise, clinic-safe JSON only.`,
          role: "system",
          type: "message",
        },
        {
          content: buildSourceText(input),
          role: "user",
          type: "message",
        },
      ],
      model: env.openaiModel,
      reasoning: { effort: "low" },
      text: {
        format: {
          description: "Generate a structured dental reception summary for the clinic dashboard.",
          name: "clinicflow_call_summary",
          schema: {
            additionalProperties: false,
            properties: {
              appointment_recommendation: { type: "string" },
              clinical_summary: { type: "string" },
              follow_up_recommendation: { type: "string" },
              patient_summary: { type: "string" },
              reception_notes: { type: "string" },
              response_tone: { enum: ["warm_professional", "urgent_callback", "booking_focused"], type: "string" },
              urgency_score: { minimum: 0, maximum: 100, type: "integer" },
            },
            required: [
              "appointment_recommendation",
              "clinical_summary",
              "follow_up_recommendation",
              "patient_summary",
              "reception_notes",
              "response_tone",
              "urgency_score",
            ],
            type: "object",
          },
          strict: true,
          type: "json_schema",
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    output?: Array<
      | {
          content?: Array<{ text?: string; type?: string }>;
          type?: string;
        }
      | unknown
    >;
    output_text?: string;
  };

  const rawText =
    data.output_text ??
    data.output
      ?.flatMap((item) => {
        if (!item || typeof item !== "object" || !("content" in item)) {
          return [];
        }

        const content = (item as { content?: Array<{ text?: string; type?: string }> }).content ?? [];
        return content
          .filter((part): part is { text: string; type: string } => Boolean(part && part.type === "output_text" && part.text))
          .map((part) => part.text);
      })
      .join("\n")
      .trim();

  if (!rawText) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawText) as OpenAiSummaryResponse;
    return {
      appointmentRecommendation: parsed.appointment_recommendation,
      clinicalSummary: parsed.clinical_summary,
      followUpRecommendation: parsed.follow_up_recommendation,
      patientSummary: parsed.patient_summary,
      receptionNotes: parsed.reception_notes,
      responseTone: parsed.response_tone,
      urgencyScore: parsed.urgency_score,
    };
  } catch {
    return null;
  }
}

function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function generateCallReceptionSummary(input: CallReceptionSummaryContext) {
  const openAiSummary = await requestOpenAiSummary(input);
  const summary = openAiSummary ?? deriveSummaryFromContext(input);
  const source = buildSourceText(input);

  return {
    inputHash: stableHash({ callId: input.call.id, source }),
    modelName: getBackendEnv().openaiModel,
    modelProvider: openAiSummary ? ("openai" as const) : ("manual" as const),
    outputHash: stableHash(summary),
    summary,
  };
}
const activeFlowPlatformProfile = getActiveFlowPlatformProfile();
