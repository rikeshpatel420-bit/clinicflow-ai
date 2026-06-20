"use server";

import { createHash } from "node:crypto";
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

  const admin = createSupabaseAdminClient();
  const actorUserId = user.id;
  const { data: lead, error: leadError } = await admin
    .from("patient_leads")
    .insert({
      clinic_id: membership.clinic_id,
      created_by: actorUserId,
      enquiry_summary:
        "Sarah Ahmed: Emergency toothache enquiry. Patient called out of hours and needs callback today. Source: manual_demo. Phone: 07123 456789.",
      estimated_value_pence: 18000,
      lead_score: 90,
      owner_user_id: actorUserId,
      priority: "urgent",
      source: "manual",
      status: "new",
      updated_by: actorUserId,
    })
    .select("id")
    .single<{ id: string }>();

  if (leadError || !lead) {
    redirect("/calls?demo=error");
  }

  const callerNumberHash = createHash("sha256").update("07123456789").digest("hex");
  const { error: callError } = await admin.from("calls").insert({
    caller_number_hash: callerNumberHash,
    caller_number_last4: "6789",
    clinic_id: membership.clinic_id,
    direction: "inbound",
    lead_id: lead.id,
    provider: "manual",
    status: "missed",
  });

  if (callError) {
    await admin.from("patient_leads").delete().eq("id", lead.id).eq("clinic_id", membership.clinic_id);
    redirect("/calls?demo=error");
  }

  revalidatePath("/calls");
  revalidatePath("/dashboard");
  revalidatePath("/patients");
  redirect("/calls?demo=added");
}
