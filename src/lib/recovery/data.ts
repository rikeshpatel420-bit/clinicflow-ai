import type { User } from "@supabase/supabase-js";
import type { Call, Clinic, PatientLead, RecoveryWorkflow } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RecoveryOpportunityView = {
  booked_at: string | null;
  call_id: string | null;
  clinic_id: string;
  created_at: string;
  estimated_revenue_pence: number;
  id: string;
  lost_reason: string | null;
  next_action: string;
  patient_id: string | null;
  priority_score: number;
  stage: "booked" | "contacted" | "lost" | "missed" | "replied";
  updated_at: string;
};

export const demoRecoveryOpportunities: RecoveryOpportunityView[] = [
  {
    id: "77777777-7777-4777-8777-777777777771",
    clinic_id: demoClinic.id,
    call_id: "33333333-3333-4333-8333-333333333331",
    patient_id: demoPatients[0]?.id ?? null,
    stage: "booked",
    priority_score: 92,
    estimated_revenue_pence: 35000,
    booked_at: new Date().toISOString(),
    lost_reason: null,
    next_action: "Confirm consultation attendance.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "77777777-7777-4777-8777-777777777772",
    clinic_id: demoClinic.id,
    call_id: null,
    patient_id: demoPatients[1]?.id ?? null,
    stage: "contacted",
    priority_score: 76,
    estimated_revenue_pence: 18000,
    booked_at: null,
    lost_reason: null,
    next_action: "Follow up with reschedule options.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", { currency: "GBP", style: "currency" }).format(pence / 100);
}

export function calculateRecoveryMetrics(opportunities: RecoveryOpportunityView[]) {
  const booked = opportunities.filter((item) => item.stage === "booked");
  const open = opportunities.filter((item) => item.stage !== "booked" && item.stage !== "lost");
  const revenueRecovered = booked.reduce((total, item) => total + item.estimated_revenue_pence, 0);
  const moneyLeftOnTable = open.reduce((total, item) => total + item.estimated_revenue_pence, 0);
  const conversionRate = opportunities.length ? Math.round((booked.length / opportunities.length) * 100) : 0;
  const monthlyProjection = revenueRecovered * 4;

  return {
    bookedCount: booked.length,
    conversionRate,
    highPriority: opportunities.filter((item) => item.priority_score >= 75),
    moneyLeftOnTable,
    monthlyProjection,
    openCount: open.length,
    revenueRecovered,
  };
}

function stageFromLeadStatus(status: PatientLead["status"]): RecoveryOpportunityView["stage"] {
  if (status === "booked" || status === "won") return "booked";
  if (status === "lost" || status === "opted_out" || status === "archived") return "lost";
  if (status === "qualified" || status === "recovered") return "replied";
  if (status === "contacted") return "contacted";
  return "missed";
}

function nextActionForLead(lead: PatientLead, workflow?: RecoveryWorkflow, call?: Call) {
  if (workflow?.next_action_at) {
    return `Follow up scheduled for ${new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
    }).format(new Date(workflow.next_action_at))}.`;
  }

  if (call?.recovery_next_action) return call.recovery_next_action;
  if (lead.status === "booked" || lead.status === "won") return "Confirm appointment and prepare reception handover.";
  if (lead.status === "recovered") return "Call back and confirm the next step.";
  if (lead.status === "opted_out") return "Record opt-out and close the recovery thread.";
  if (lead.next_follow_up_at) return "Continue lead recovery follow-up.";
  return "Review enquiry and decide next recovery step.";
}

function buildOpportunitiesFromLiveRows(input: {
  calls: Call[];
  leads: PatientLead[];
  workflows: RecoveryWorkflow[];
}): RecoveryOpportunityView[] {
  return input.leads
    .map((lead) => {
      const call = input.calls.find((item) => item.lead_id === lead.id);
      const workflow = input.workflows.find((item) => item.lead_id === lead.id || (call && item.call_id === call.id));

      return {
        booked_at: lead.converted_at,
        call_id: call?.id ?? null,
        clinic_id: lead.clinic_id,
        created_at: lead.created_at,
        estimated_revenue_pence: lead.estimated_value_pence ?? 0,
        id: lead.id,
        lost_reason: null,
        next_action: nextActionForLead(lead, workflow, call),
        patient_id: null,
        priority_score: lead.lead_score,
        stage: stageFromLeadStatus(lead.status),
        updated_at: lead.updated_at,
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score);
}

export async function getRecoveryData(user: Pick<User, "email" | "id" | "user_metadata"> | null) {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return { clinic: demoClinic as Clinic | null, opportunities: demoRecoveryOpportunities, source: "demo" as const };
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) return { clinic: null, opportunities: [], source: "supabase" as const };

  const [{ data: clinic }, { data: leads }, { data: calls }, { data: workflows }] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("patient_leads")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<PatientLead[]>(),
    supabase
      .from("calls")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("started_at", { ascending: false })
      .limit(50)
      .returns<Call[]>(),
    supabase
      .from("recovery_workflows")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<RecoveryWorkflow[]>(),
  ]);

  return {
    clinic: clinic ?? null,
    opportunities: buildOpportunitiesFromLiveRows({
      calls: calls ?? [],
      leads: leads ?? [],
      workflows: workflows ?? [],
    }),
    source: "supabase" as const,
  };
}
