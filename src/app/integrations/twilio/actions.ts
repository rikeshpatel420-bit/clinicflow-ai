"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { type TwilioWebhookPayload } from "@/lib/twilio/missed-call";
import { hashPhoneNumber, normalizePhoneNumber } from "@/lib/twilio/crypto";
import { deleteTwilioConnection, getTwilioConnectionForClinic, saveTwilioConnection, verifyTwilioConnection } from "@/lib/twilio/config";
import { processTwilioCallWebhook } from "@/lib/twilio/recovery";
import { createRecoverySmsDraft, sendRecoverySms } from "@/lib/twilio/sms";
import { getCurrentUser } from "@/lib/supabase/server";

function mustBeOwnerOrAdmin(role?: string | null) {
  return role === "owner" || role === "admin";
}

async function getClinicName(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("clinics").select("name").eq("id", clinicId).maybeSingle<{ name: string }>();

  if (error || !data) {
    return null;
  }

  return data.name;
}

async function updateTwilioConnectionHealth(clinicId: string, userId: string, errorMessage: string | null) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("twilio_connections")
    .update({
      last_error: errorMessage,
      last_validated_at: errorMessage ? null : new Date().toISOString(),
      status: errorMessage ? "error" : "active",
      updated_by: userId,
    })
    .eq("clinic_id", clinicId);
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

export async function testTwilioSmsAction() {
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
    redirect("/integrations/twilio?status=sms-error");
  }

  if (!connection) {
    redirect("/integrations/twilio?status=no-connection");
  }

  const clinicName = await getClinicName(membership.clinic_id);
  const draft = createRecoverySmsDraft({
    clinicName,
    patientPhone: connection.forward_to_number,
  });
  const result = await sendRecoverySms({
    connection,
    draft,
  });

  if (result.error) {
    await updateTwilioConnectionHealth(membership.clinic_id, user.id, result.error);
    redirect("/integrations/twilio?status=sms-error");
  }

  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  await admin
    .from("sms_events")
    .insert({
      body_preview: draft.body.slice(0, 500),
      call_id: null,
      clinic_id: membership.clinic_id,
      direction: "outbound",
      from_number_hash: hashPhoneNumber(connection.voice_number),
      lead_id: null,
      occurred_at: now,
      provider: "twilio",
      provider_message_id: result.messageSid ?? `twilio-test-sms-${membership.clinic_id.slice(0, 8)}-${Date.now().toString(36)}`,
      recovery_workflow_id: null,
      status: "sent",
      to_number_hash: hashPhoneNumber(connection.forward_to_number),
      to_number_last4: normalizePhoneNumber(connection.forward_to_number)?.slice(-4) ?? null,
    });

  await updateTwilioConnectionHealth(membership.clinic_id, user.id, null);

  revalidatePath("/integrations");
  revalidatePath("/integrations/twilio");
  revalidatePath("/dashboard");

  redirect("/integrations/twilio?status=sms-tested");
}

export async function testTwilioCallRecoveryAction() {
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
    redirect("/integrations/twilio?status=call-error");
  }

  if (!connection) {
    redirect("/integrations/twilio?status=no-connection");
  }

  const testCaller = connection.forward_to_number;
  const payload: TwilioWebhookPayload = {
    AnsweredBy: "",
    Body: "",
    CallDuration: "0",
    CallSid: `twilio-test-call-${membership.clinic_id.slice(0, 8)}-${Date.now().toString(36)}`,
    CallStatus: "no-answer",
    Called: connection.voice_number,
    Direction: "inbound",
    From: testCaller,
    MessageSid: "",
    SmsStatus: "",
    To: connection.voice_number,
  };

  const result = await processTwilioCallWebhook(payload);
  if (!result.ok) {
    await updateTwilioConnectionHealth(membership.clinic_id, user.id, result.error ?? "Twilio call recovery test failed.");
    redirect("/integrations/twilio?status=call-error");
  }

  await updateTwilioConnectionHealth(membership.clinic_id, user.id, null);

  revalidatePath("/integrations");
  revalidatePath("/integrations/twilio");
  revalidatePath("/dashboard");
  revalidatePath("/calls");
  revalidatePath("/patients");

  redirect("/integrations/twilio?status=call-tested");
}
