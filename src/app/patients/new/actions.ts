"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function appendDetail(parts: string[], label: string, value: string) {
  if (value) parts.push(`${label}: ${value}`);
}

export async function createPatientLeadAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/patients/new");
  }

  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    redirect("/onboarding");
  }

  const fullName = formValue(formData, "fullName");
  const email = formValue(formData, "email");
  const phone = formValue(formData, "phone");
  const enquiry = formValue(formData, "enquiry");

  if (!fullName) {
    redirect("/patients/new?error=missing-name");
  }

  const summaryParts = [`${fullName}: Manual patient lead added from ClinicFlow.`];
  appendDetail(summaryParts, "Email", email);
  appendDetail(summaryParts, "Phone", phone);
  appendDetail(summaryParts, "Enquiry", enquiry);

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("patient_leads").insert({
    clinic_id: membership.clinic_id,
    created_at: now,
    created_by: user.id,
    enquiry_summary: summaryParts.join(" "),
    estimated_value_pence: 0,
    lead_score: 50,
    next_follow_up_at: null,
    owner_user_id: user.id,
    priority: "normal",
    source: "manual",
    status: "new",
    updated_at: now,
    updated_by: user.id,
  });

  if (error) {
    redirect("/patients/new?error=save-failed");
  }

  revalidatePath("/patients");
  revalidatePath("/dashboard");
  redirect("/patients?created=1");
}
