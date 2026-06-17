import type { User } from "@supabase/supabase-js";
import type { Clinic, RecoveryOpportunity } from "@/types/database";
import { demoClinic, demoPatients } from "@/lib/dashboard/data";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const demoRecoveryOpportunities: RecoveryOpportunity[] = [
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
    deleted_at: null,
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
    deleted_at: null,
  },
];

export function formatCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", { currency: "GBP", style: "currency" }).format(pence / 100);
}

export function calculateRecoveryMetrics(opportunities: RecoveryOpportunity[]) {
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

export async function getRecoveryData(user: Pick<User, "email" | "id" | "user_metadata"> | null) {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured || !user) {
    return { clinic: demoClinic as Clinic | null, opportunities: demoRecoveryOpportunities, source: "demo" as const };
  }

  const supabase = await createSupabaseServerClient();
  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) return { clinic: null, opportunities: [], source: "supabase" as const };

  const [{ data: clinic }, { data: opportunities }] = await Promise.all([
    supabase.from("clinics").select("*").eq("id", membership.clinic_id).maybeSingle<Clinic>(),
    supabase
      .from("recovery_opportunities")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .is("deleted_at", null)
      .order("priority_score", { ascending: false })
      .returns<RecoveryOpportunity[]>(),
  ]);

  return { clinic: clinic ?? null, opportunities: opportunities ?? [], source: "supabase" as const };
}
