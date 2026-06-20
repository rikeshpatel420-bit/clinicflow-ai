"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { deleteTwilioConnection, getTwilioConnectionForClinic, saveTwilioConnection, verifyTwilioConnection } from "@/lib/twilio/config";
import { getCurrentUser } from "@/lib/supabase/server";

function mustBeOwnerOrAdmin(role?: string | null) {
  return role === "owner" || role === "admin";
}

export async function saveTwilioConfigAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const accountSid = String(formData.get("account_sid") ?? "").trim();
  const authToken = String(formData.get("auth_token") ?? "").trim();
  const voiceNumber = String(formData.get("voice_number") ?? "").trim();
  const forwardToNumber = String(formData.get("forward_to_number") ?? "").trim();

  if (!accountSid || !authToken || !voiceNumber || !forwardToNumber) {
    redirect("/integrations/twilio?status=missing-fields");
  }

  const result = await saveTwilioConnection({
    accountSid,
    authToken,
    clinicId: membership.clinic_id,
    createdBy: user.id,
    forwardToNumber,
    voiceNumber,
  });

  if (result.error) {
    redirect("/integrations/twilio?status=error");
  }

  revalidatePath("/integrations");
  revalidatePath("/integrations/twilio");
  revalidatePath("/dashboard");
  redirect("/integrations/twilio?status=saved");
}

export async function deleteTwilioConfigAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const result = await deleteTwilioConnection(membership.clinic_id);
  if (result.error) {
    redirect("/integrations/twilio?status=error");
  }

  revalidatePath("/integrations");
  revalidatePath("/integrations/twilio");
  revalidatePath("/dashboard");
  redirect("/integrations/twilio?status=deleted");
}

export async function testTwilioConfigAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const { connection, error } = await getTwilioConnectionForClinic(membership.clinic_id);
  if (error) {
    redirect("/integrations/twilio?status=test-error");
  }

  if (!connection) {
    redirect("/integrations/twilio?status=no-connection");
  }

  const validation = await verifyTwilioConnection(connection);
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("twilio_connections")
    .update({
      last_error: validation.error,
      last_validated_at: validation.error ? connection.last_validated_at : now,
      status: validation.error ? "error" : "active",
      updated_by: user.id,
    })
    .eq("clinic_id", membership.clinic_id);

  revalidatePath("/integrations");
  revalidatePath("/integrations/twilio");
  revalidatePath("/dashboard");

  redirect(validation.error ? "/integrations/twilio?status=test-error" : "/integrations/twilio?status=tested");
}
