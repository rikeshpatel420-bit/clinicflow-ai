"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

export async function addDemoCallAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/calls");
  }

  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership || !["admin", "owner"].includes(membership.role)) {
    redirect("/calls?demo=not-authorised");
  }

  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("calls").insert({
    caller_number: "07123 456789",
    caller_number_hash: null,
    caller_number_last4: "6789",
    clinic_id: membership.clinic_id,
    created_at: now,
    direction: "inbound",
    duration_seconds: null,
    ended_at: null,
    lead_id: null,
    patient_id: null,
    provider: "manual",
    provider_call_id: `manual_demo-${crypto.randomUUID()}`,
    recovery_next_action: "Patient called out of hours and needs callback today.",
    recovery_status: "queued",
    recovery_updated_at: now,
    started_at: now,
    status: "missed",
    summary: "Sarah Ahmed - Emergency toothache enquiry - Source: manual_demo - Estimated value: \u00A3180.",
    updated_at: now,
  });

  if (error) {
    redirect("/calls?demo=error");
  }

  revalidatePath("/calls");
  revalidatePath("/dashboard");
  redirect("/calls?demo=added");
}
