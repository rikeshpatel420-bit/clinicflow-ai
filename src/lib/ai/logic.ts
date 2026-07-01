import { createConversationEngine } from "@/lib/conversation/engine";
import { buildConversationEngineConfig, getActiveFlowPlatformProfile } from "@/lib/flow-platform";

export type EnquiryCategory = string;

export type ReceptionistState =
  | "classified"
  | "draft_ready"
  | "awaiting_staff_approval"
  | "follow_up_scheduled"
  | "escalated"
  | "closed";

export type AiDraftTone = "warm_professional" | "urgent_callback" | "booking_focused";

const activeFlowPlatformProfile = getActiveFlowPlatformProfile();
const leadConversationConfig = buildConversationEngineConfig(activeFlowPlatformProfile.conversation.leads);
const enquiryIntentEngine = createConversationEngine<EnquiryCategory>({
  ...leadConversationConfig,
  entityRules: undefined,
});

export function classifyIntent(text: string): EnquiryCategory {
  return enquiryIntentEngine.classifyIntent(text).intent;
}

export function scoreLead(category: EnquiryCategory, minutesSinceContact: number, estimatedValue: number) {
  const categoryWeight: Record<string, number> = {
    emergency: 35,
    implant_consult: 32,
    new_patient: 28,
    hygiene_recall: 18,
    price_question: 16,
    reschedule: 12,
    general_admin: 8,
    emergency_leak: 35,
    burst_pipe: 34,
    gas_safety: 38,
    boiler_issue: 30,
    blocked_drain: 22,
    quote_request: 18,
    routine_service: 14,
  };
  const recency = Math.max(0, 30 - Math.floor(minutesSinceContact / 3));
  const value = Math.min(30, Math.floor(estimatedValue / 40));
  return Math.min(100, (categoryWeight[category] ?? 12) + recency + value);
}

export function recommendNextAction(category: EnquiryCategory, score: number) {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("emergency") || normalizedCategory.includes("gas_safety")) {
    return "Escalate for an urgent callback before routine tasks.";
  }

  if (score >= 80) return "Prioritise same-day staff-approved reply and booking slot offer.";
  if (normalizedCategory.includes("implant") || normalizedCategory.includes("boiler")) return "Offer consultation or engineer availability and capture the preferred callback window.";
  if (normalizedCategory.includes("quote") || normalizedCategory.includes("price")) return "Answer generally, avoid definitive quotes, and guide to assessment booking.";
  if (normalizedCategory.includes("routine_service") || normalizedCategory.includes("new_job")) return "Capture the request and confirm the best time for the team to call back.";
  return "Send staff-approved follow-up and monitor for reply.";
}

export function needsEscalation(category: EnquiryCategory, score: number) {
  const normalizedCategory = category.toLowerCase();
  return normalizedCategory.includes("emergency") || normalizedCategory.includes("gas_safety") || score >= 90;
}

