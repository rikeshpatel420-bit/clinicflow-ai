import { createConversationEngine } from "@/lib/conversation/engine";
import { buildConversationEngineConfig, getActiveFlowPlatformProfile } from "@/lib/flow-platform";

export type EnquiryCategory =
  | "new_patient"
  | "emergency"
  | "implant_consult"
  | "hygiene_recall"
  | "price_question"
  | "reschedule"
  | "general_admin";

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
  const categoryWeight: Record<EnquiryCategory, number> = {
    emergency: 35,
    implant_consult: 32,
    new_patient: 28,
    hygiene_recall: 18,
    price_question: 16,
    reschedule: 12,
    general_admin: 8,
  };
  const recency = Math.max(0, 30 - Math.floor(minutesSinceContact / 3));
  const value = Math.min(30, Math.floor(estimatedValue / 40));
  return Math.min(100, categoryWeight[category] + recency + value);
}

export function recommendNextAction(category: EnquiryCategory, score: number) {
  if (category === "emergency") return "Escalate for urgent clinical callback before routine tasks.";
  if (score >= 80) return "Prioritise same-day staff-approved reply and booking slot offer.";
  if (category === "implant_consult") return "Offer consultation availability and capture preferred callback window.";
  if (category === "price_question") return "Answer generally, avoid definitive quotes, and guide to assessment booking.";
  return "Send staff-approved follow-up and monitor for reply.";
}

export function needsEscalation(category: EnquiryCategory, score: number) {
  return category === "emergency" || score >= 90;
}

