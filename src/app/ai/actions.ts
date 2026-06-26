"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

function splitLines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveReceptionSummaryAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/ai");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership) {
    redirect("/onboarding");
  }

  const summary = String(formData.get("patient_summary") ?? "").trim();
  const reasonForCalling = String(formData.get("reason_for_calling") ?? "").trim();
  const clinicalNotes = String(formData.get("clinical_notes") ?? "").trim();
  const receptionNotes = String(formData.get("reception_notes") ?? "").trim();
  const urgencyScore = Number(formData.get("urgency_score") ?? 0);
  const appointmentRecommendation = String(formData.get("appointment_recommendation") ?? "").trim();
  const treatmentRecommendation = String(formData.get("treatment_recommendation") ?? "").trim();
  const smsRecommendation = String(formData.get("sms_recommendation") ?? "").trim();
  const emailRecommendation = String(formData.get("email_recommendation") ?? "").trim();
  const followUpActions = splitLines(String(formData.get("follow_up_actions") ?? ""));
  const outstandingTasks = splitLines(String(formData.get("outstanding_tasks") ?? ""));
  const callId = String(formData.get("call_id") ?? "").trim() || null;
  const leadId = String(formData.get("lead_id") ?? "").trim() || null;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ai_audit_logs").insert({
    action: "summary_created",
    actor_user_id: user.id,
    clinic_id: membership.clinic_id,
    call_id: callId,
    lead_id: leadId,
    metadata: {
      appointmentRecommendation,
      clinicalNotes,
      followUpActions,
      leadId,
      outstandingTasks,
      patientSummary: summary,
      reasonForCalling,
      receptionNotes,
      smsRecommendation,
      treatmentRecommendation,
      urgencyScore,
      emailRecommendation,
    },
    human_approved: true,
    model_name: "manual",
    model_provider: "manual",
    safety_status: "not_required",
  });

  if (error) {
    redirect("/ai?status=error");
  }

  revalidatePath("/ai");
  redirect("/ai?status=saved");
}
