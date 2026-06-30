"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { type TwilioWebhookPayload } from "@/lib/twilio/missed-call";
import { hashPhoneNumber, normalizePhoneNumber } from "@/lib/twilio/crypto";
import { deleteTwilioConnection, getTwilioConnectionForClinic, isMissingTwilioConnectionsTableError, saveTwilioConnection, verifyTwilioConnection } from "@/lib/twilio/config";
import { processTwilioCallWebhook, processTwilioSmsWebhook, refreshCallReceptionSummary } from "@/lib/twilio/recovery";
import { createRecoverySmsDraft, sendRecoverySms } from "@/lib/twilio/sms";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Call } from "@/types/database";

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
      active: !errorMessage,
      last_error: errorMessage,
      last_validated_at: errorMessage ? null : new Date().toISOString(),
      status: errorMessage ? "error" : "active",
      updated_by: userId,
    })
    .eq("clinic_id", clinicId);
}

const DEMO_PATIENT_NUMBER = "07123 456789";

function buildDemoCallSid(clinicId: string, tag: string) {
  return `demo-${tag}-${clinicId.slice(0, 8)}-${Date.now().toString(36)}`;
}

function buildDemoMessageSid(clinicId: string, tag: string) {
  return `demo-msg-${tag}-${clinicId.slice(0, 8)}-${Date.now().toString(36)}`;
}

async function getClinicTwilioConnection(clinicId: string) {
  const { connection, error, tableMissing } = await getTwilioConnectionForClinic(clinicId);
  if (error) {
    return { connection: null, error };
  }

  if (tableMissing) {
    return { connection: null, error: "Twilio connection table is not available yet." };
  }

  if (!connection) {
    return { connection: null, error: "No Twilio connection found for this clinic." };
  }

  return { connection, error: null };
}

async function revalidateTwilioDemoPaths() {
  revalidatePath("/integrations/twilio");
  revalidatePath("/dashboard");
  revalidatePath("/calls");
  revalidatePath("/patients");
  revalidatePath("/inbox");
  revalidatePath("/ai");
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
    redirect(isMissingTwilioConnectionsTableError(result.error) ? "/integrations/twilio?status=storage-missing" : "/integrations/twilio?status=error");
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
      active: !validation.error,
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

export async function simulateIncomingCallAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const { connection, error } = await getClinicTwilioConnection(membership.clinic_id);
  if (error || !connection) {
    redirect("/integrations/twilio?status=demo-needs-connection");
  }

  const result = await processTwilioCallWebhook({
    AnsweredBy: "human",
    Body: "I'd like to know about treatment options and availability.",
    CallDuration: "42",
    CallSid: buildDemoCallSid(membership.clinic_id, "incoming"),
    CallStatus: "in-progress",
    Called: connection.voice_number,
    Direction: "inbound",
    From: DEMO_PATIENT_NUMBER,
    MessageSid: "",
    SmsStatus: "",
    To: connection.voice_number,
  });

  if (!result.ok) {
    redirect("/integrations/twilio?status=demo-error");
  }

  await revalidateTwilioDemoPaths();
  redirect("/integrations/twilio?status=incoming-simulated");
}

export async function simulateMissedCallAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const { connection, error } = await getClinicTwilioConnection(membership.clinic_id);
  if (error || !connection) {
    redirect("/integrations/twilio?status=demo-needs-connection");
  }

  const result = await processTwilioCallWebhook({
    AnsweredBy: "",
    Body: "",
    CallDuration: "0",
    CallSid: buildDemoCallSid(membership.clinic_id, "missed"),
    CallStatus: "no-answer",
    Called: connection.voice_number,
    Direction: "inbound",
    From: DEMO_PATIENT_NUMBER,
    MessageSid: "",
    SmsStatus: "",
    To: connection.voice_number,
  });

  if (!result.ok) {
    redirect("/integrations/twilio?status=demo-error");
  }

  await revalidateTwilioDemoPaths();
  redirect("/integrations/twilio?status=missed-simulated");
}

export async function simulateSmsReplyAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const { connection, error } = await getClinicTwilioConnection(membership.clinic_id);
  if (error || !connection) {
    redirect("/integrations/twilio?status=demo-needs-connection");
  }

  const result = await processTwilioSmsWebhook({
    AnsweredBy: "",
    Body: "YES please call me back today.",
    CallDuration: "",
    CallSid: buildDemoCallSid(membership.clinic_id, "reply"),
    CallStatus: "",
    Called: connection.voice_number,
    Direction: "inbound",
    From: DEMO_PATIENT_NUMBER,
    MessageSid: buildDemoMessageSid(membership.clinic_id, "reply"),
    SmsStatus: "received",
    To: connection.voice_number,
  });

  if (!result.ok) {
    if (result.error?.toLowerCase().includes("no recovery thread")) {
      redirect("/integrations/twilio?status=demo-needs-missed-call");
    }

    redirect("/integrations/twilio?status=demo-error");
  }

  await revalidateTwilioDemoPaths();
  redirect("/integrations/twilio?status=reply-simulated");
}

export async function generateTwilioAiSummaryAction() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/integrations/twilio");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/integrations/twilio?status=not-authorised");
  }

  const { connection, error } = await getClinicTwilioConnection(membership.clinic_id);
  if (error || !connection) {
    redirect("/integrations/twilio?status=demo-needs-connection");
  }

  const admin = createSupabaseAdminClient();
  const { data: call } = await admin
    .from("calls")
    .select("*")
    .eq("clinic_id", membership.clinic_id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<Call>();

  if (!call) {
    redirect("/integrations/twilio?status=demo-needs-call");
  }

  const summaryResult = await refreshCallReceptionSummary({
    call,
    clinicName: (await getClinicName(membership.clinic_id)) ?? "ClinicFlow clinic",
    connection,
  });

  if (summaryResult.error) {
    redirect("/integrations/twilio?status=demo-error");
  }

  await revalidateTwilioDemoPaths();
  redirect("/integrations/twilio?status=summary-generated");
}
