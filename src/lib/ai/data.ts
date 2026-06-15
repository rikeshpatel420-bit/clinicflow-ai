import type { EnquiryCategory, ReceptionistState } from "@/lib/ai/logic";
import { classifyIntent, needsEscalation, recommendNextAction, scoreLead } from "@/lib/ai/logic";

export type AiLeadInsight = {
  id: string;
  patientLabel: string;
  enquiry: string;
  category: EnquiryCategory;
  score: number;
  estimatedRevenue: number;
  state: ReceptionistState;
  nextAction: string;
  draft: string;
  summary: string;
};

const rawLeads = [
  {
    id: "ai-1",
    patientLabel: "Demo lead A",
    enquiry: "I missed a call and want to ask about implant options and consultation availability.",
    minutesSinceContact: 18,
    estimatedRevenue: 950,
    state: "draft_ready" as ReceptionistState,
  },
  {
    id: "ai-2",
    patientLabel: "Demo lead B",
    enquiry: "I have tooth pain and swelling. Can someone call me today?",
    minutesSinceContact: 42,
    estimatedRevenue: 280,
    state: "escalated" as ReceptionistState,
  },
  {
    id: "ai-3",
    patientLabel: "Demo lead C",
    enquiry: "How much does a hygiene appointment cost for a new patient?",
    minutesSinceContact: 9,
    estimatedRevenue: 160,
    state: "awaiting_staff_approval" as ReceptionistState,
  },
];

export const aiLeads: AiLeadInsight[] = rawLeads.map((lead) => {
  const category = classifyIntent(lead.enquiry);
  const score = scoreLead(category, lead.minutesSinceContact, lead.estimatedRevenue);
  return {
    ...lead,
    category,
    score,
    nextAction: recommendNextAction(category, score),
    draft:
      category === "emergency"
        ? "Thanks for contacting the clinic. A team member should call you as soon as possible to understand your symptoms and guide next steps. If symptoms feel severe, seek urgent medical advice."
        : "Thanks for getting in touch. The clinic team can help with this and confirm the best appointment options. What days or times usually work for you?",
    summary: `Classified as ${category.replace("_", " ")} with ${score}% booking priority. Staff approval required before any outbound message.`,
  };
});

export const aiDemo = {
  metrics: [
    { label: "Intent accuracy target", value: "90%+", note: "future measured QA" },
    { label: "Drafts awaiting review", value: "8", note: "staff approval only" },
    { label: "Escalations triggered", value: String(aiLeads.filter((lead) => needsEscalation(lead.category, lead.score)).length), note: "demo rules" },
    { label: "Revenue influenced", value: "GBP 1,390", note: "demo lead value" },
  ],
  guardrails: [
    "Do not diagnose, prescribe, or make clinical claims.",
    "Escalate pain, swelling, bleeding, safeguarding, or urgent medical language.",
    "Use staff approval before any outbound patient communication.",
    "Avoid exact pricing promises unless clinic-approved knowledge confirms it.",
  ],
  knowledgeBase: [
    { title: "Opening hours", status: "placeholder", content: "Clinic hours, emergency rules, and location-specific availability." },
    { title: "Services", status: "placeholder", content: "Implants, hygiene, cosmetic consults, orthodontics, and general dentistry." },
    { title: "Booking rules", status: "placeholder", content: "Deposit rules, lead times, appointment durations, and staff routing." },
    { title: "Approved FAQs", status: "placeholder", content: "Safe non-clinical responses reviewed by clinic leadership." },
  ],
  workflowStates: ["classified", "draft_ready", "awaiting_staff_approval", "follow_up_scheduled", "escalated", "closed"] satisfies ReceptionistState[],
  leads: aiLeads,
};

