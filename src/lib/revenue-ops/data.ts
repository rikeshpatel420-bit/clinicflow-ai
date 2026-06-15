import type { AutomationCadence, OpportunityStage } from "@/lib/revenue-ops/scoring";
import { forecastRecoveredRevenue, getRecommendedCadence, scoreRevenueOpportunity } from "@/lib/revenue-ops/scoring";

export type RevenueOpportunity = {
  id: string;
  patient: string;
  type: "missed_call" | "unscheduled_treatment" | "inactive_patient" | "cancellation" | "no_show_risk";
  stage: OpportunityStage;
  value: number;
  urgency: number;
  intent: number;
  lastContactDays: number;
  score: number;
  cadence: AutomationCadence;
  recommendation: string;
};

const rawOpportunities = [
  {
    id: "opp-1",
    patient: "Amelia Carter",
    type: "unscheduled_treatment",
    stage: "prioritised",
    value: 2400,
    urgency: 88,
    intent: 76,
    lastContactDays: 2,
    recommendation: "Call today and offer two consultation times for treatment plan review.",
  },
  {
    id: "opp-2",
    patient: "Noah Williams",
    type: "missed_call",
    stage: "contacted",
    value: 380,
    urgency: 92,
    intent: 84,
    lastContactDays: 0,
    recommendation: "Front desk should complete callback before routine admin.",
  },
  {
    id: "opp-3",
    patient: "Sofia Khan",
    type: "inactive_patient",
    stage: "new",
    value: 640,
    urgency: 54,
    intent: 58,
    lastContactDays: 18,
    recommendation: "Queue reactivation sequence with staff-approved hygiene reminder.",
  },
  {
    id: "opp-4",
    patient: "Daniel Moore",
    type: "cancellation",
    stage: "prioritised",
    value: 220,
    urgency: 81,
    intent: 62,
    lastContactDays: 1,
    recommendation: "Offer same-week replacement slot and protect chair utilisation.",
  },
  {
    id: "opp-5",
    patient: "Olivia Brown",
    type: "no_show_risk",
    stage: "new",
    value: 180,
    urgency: 73,
    intent: 51,
    lastContactDays: 3,
    recommendation: "Send confirmation nudge and flag if no reply by 15:00.",
  },
] satisfies Omit<RevenueOpportunity, "score" | "cadence">[];

const opportunities: RevenueOpportunity[] = rawOpportunities.map((item) => {
  const score = scoreRevenueOpportunity(item);
  return { ...item, score, cadence: getRecommendedCadence(score) };
});

export const revenueOpsDemo = {
  opportunities,
  metrics: [
    { label: "Pipeline value", value: "GBP 3.8k", note: "demo open value" },
    { label: "Forecast recovery", value: `GBP ${forecastRecoveredRevenue(opportunities).toLocaleString("en-GB")}`, note: "score weighted" },
    { label: "Tasks due today", value: "14", note: "front-desk queue" },
    { label: "Acceptance pipeline", value: "63%", note: "demo conversion" },
  ],
  tasks: [
    { id: "task-1", title: "Call Amelia about treatment plan", owner: "Maya Shah", priority: "critical", due: "Today 11:30", value: 2400 },
    { id: "task-2", title: "Confirm Noah's preferred appointment slot", owner: "James Carter", priority: "high", due: "Today 12:00", value: 380 },
    { id: "task-3", title: "Approve hygiene reactivation draft", owner: "Reception pool", priority: "medium", due: "Today 15:00", value: 640 },
    { id: "task-4", title: "Review cancellation recovery list", owner: "Maya Shah", priority: "high", due: "Today 16:00", value: 220 },
  ],
  lifecycle: [
    { stage: "New enquiry", count: 18, automation: "Classify intent and prioritise lead" },
    { stage: "Consult booked", count: 11, automation: "Send reminder and prepare front-desk context" },
    { stage: "Treatment proposed", count: 8, automation: "Track acceptance and follow-up windows" },
    { stage: "Unscheduled treatment", count: 6, automation: "Queue recovery tasks by value and urgency" },
    { stage: "Dormant patient", count: 42, automation: "Reactivation sequence with staff approval" },
  ],
  timeline: [
    { id: "tl-1", title: "Lead scored", detail: "Amelia assigned 80+ treatment recovery priority.", time: "09:12" },
    { id: "tl-2", title: "Task routed", detail: "High-value callback assigned to Maya Shah.", time: "09:13" },
    { id: "tl-3", title: "Draft suggested", detail: "Staff-approved follow-up prepared for inactive hygiene group.", time: "09:25" },
    { id: "tl-4", title: "Conversion logged", detail: "Noah moved from contacted to booked in demo pipeline.", time: "10:04" },
  ],
  recommendations: [
    "Prioritise treatment plan follow-ups before new recall tasks today.",
    "Run inactive hygiene reactivation every Tuesday morning for predictable recurring revenue.",
    "Escalate all same-day cancellation risks to reception before lunch.",
  ],
};

