import { createConversationEngine } from "@/lib/conversation/engine";

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

const enquiryIntentEngine = createConversationEngine<EnquiryCategory>({
  fallbackIntent: "general_admin",
  intentRules: [
    { intent: "emergency", keywords: ["pain", "swelling", "emergency", "urgent", "toothache", "broken", "abscess", "infection"], priority: 5 },
    { intent: "implant_consult", keywords: ["implant", "implant consultation", "implant enquiry", "implant options"], priority: 4 },
    { intent: "hygiene_recall", keywords: ["hygiene", "clean", "cleaning", "scale and polish", "recall"], priority: 3 },
    { intent: "price_question", keywords: ["price", "pricing", "cost", "quote", "fee", "fees", "how much", "charge"], priority: 2 },
    { intent: "reschedule", keywords: ["move", "reschedule", "cancel", "rebook", "change my appointment"], priority: 1 },
    { intent: "new_patient", keywords: ["new patient", "register", "join", "sign up", "first appointment", "first visit", "become a patient"], priority: 2 },
  ],
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

