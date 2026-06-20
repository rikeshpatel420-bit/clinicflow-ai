"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

async function removeDemoCallArtifacts(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  clinicId: string,
  options: { callId?: string; leadId?: string; workflowId?: string },
) {
  const deletes = [
    options.workflowId
      ? admin.from("recovery_workflows").delete().eq("id", options.workflowId).eq("clinic_id", clinicId)
      : null,
    options.callId ? admin.from("calls").delete().eq("id", options.callId).eq("clinic_id", clinicId) : null,
    options.leadId ? admin.from("patient_leads").delete().eq("id", options.leadId).eq("clinic_id", clinicId) : null,
  ].filter(Boolean);

  await Promise.allSettled(deletes);
}

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
  const callerNumber = "07123456789";
  const clinicNumber = "+44 20 7946 0820";
  const callerNumberHash = createHash("sha256").update(callerNumber).digest("hex");
  const clinicNumberHash = createHash("sha256").update(clinicNumber).digest("hex");
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
      source: "missed_call",
      status: "new",
      updated_by: actorUserId,
    })
    .select("id")
    .single<{ id: string }>();

  if (leadError || !lead) {
    redirect("/calls?demo=error");
  }

  const now = new Date().toISOString();
  const { data: call, error: callError } = await admin
    .from("calls")
    .insert({
      caller_number_hash: callerNumberHash,
      caller_number_last4: "6789",
      clinic_id: membership.clinic_id,
      clinic_number: clinicNumber,
      direction: "inbound",
      lead_id: lead.id,
      provider: "manual",
      recovery_next_action: "Call Sarah Ahmed back today and offer an emergency assessment slot.",
      recovery_status: "queued",
      recovery_updated_at: now,
      started_at: minutesAgo(15),
      status: "missed",
    })
    .select("id")
    .single<{ id: string }>();

  if (callError || !call) {
    await removeDemoCallArtifacts(admin, membership.clinic_id, { leadId: lead.id });
    redirect("/calls?demo=error");
  }

  const { data: workflow, error: workflowError } = await admin
    .from("recovery_workflows")
    .insert({
      assigned_user_id: actorUserId,
      call_id: call.id,
      channel: "sms",
      clinic_id: membership.clinic_id,
      current_step: 1,
      lead_id: lead.id,
      max_steps: 3,
      next_action_at: hoursFromNow(2),
      state: "queued",
    })
    .select("id")
    .single<{ id: string }>();

  if (workflowError || !workflow) {
    await removeDemoCallArtifacts(admin, membership.clinic_id, { callId: call.id, leadId: lead.id });
    redirect("/calls?demo=error");
  }

  const { error: smsError } = await admin.from("sms_events").insert({
    body_preview:
      "[ClinicFlow demo] Hi Sarah Ahmed, sorry we missed your call about your emergency toothache. Would you like us to arrange a callback today?",
    call_id: call.id,
    clinic_id: membership.clinic_id,
    direction: "outbound",
    from_number_hash: clinicNumberHash,
    lead_id: lead.id,
    occurred_at: now,
    provider: "manual",
    provider_message_id: `demo-sms-${membership.clinic_id.slice(0, 8)}`,
    recovery_workflow_id: workflow.id,
    status: "delivered",
    to_number_hash: callerNumberHash,
    to_number_last4: "6789",
  });

  if (smsError) {
    await removeDemoCallArtifacts(admin, membership.clinic_id, {
      callId: call.id,
      leadId: lead.id,
      workflowId: workflow.id,
    });
    redirect("/calls?demo=error");
  }

  revalidatePath("/calls");
  revalidatePath("/dashboard");
  revalidatePath("/patients");
  redirect("/calls?demo=added");
}
