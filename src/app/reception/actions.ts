"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildAppointmentConfirmationSmsBody, confirmCalendarBookingRequest } from "@/lib/bookings/appointments";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Appointment, BookingRequest, Call, Patient, PatientLead, RecoveryWorkflow } from "@/types/database";

function mustBeOwnerOrAdmin(role?: string | null) {
  return role === "owner" || role === "admin";
}

function revalidateReceptionRoutes() {
  revalidatePath("/reception");
  revalidatePath("/dashboard");
  revalidatePath("/calls");
  revalidatePath("/calendar");
  revalidatePath("/patients");
  revalidatePath("/inbox");
}

function hashPhoneNumber(phone: string | null | undefined) {
  const normalized = phone?.replace(/\D/g, "").trim();
  return normalized ? createHash("sha256").update(normalized).digest("hex") : null;
}

async function loadBookingRequestContext(clinicId: string, bookingRequestId: string) {
  const admin = createSupabaseAdminClient();
  const { data: bookingRequest, error: bookingRequestError } = await admin
    .from("booking_requests")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("id", bookingRequestId)
    .is("deleted_at", null)
    .maybeSingle<BookingRequest>();

  if (bookingRequestError || !bookingRequest) {
    return { appointment: null, bookingRequest: null, call: null, error: bookingRequestError?.message ?? "Booking request not found.", lead: null, patient: null, workflow: null };
  }

  const [{ data: call }, { data: lead }, { data: patient }, { data: workflow }, { data: appointment }] = await Promise.all([
    bookingRequest.call_id
      ? admin.from("calls").select("*").eq("clinic_id", clinicId).eq("id", bookingRequest.call_id).maybeSingle<Call>()
      : Promise.resolve({ data: null as Call | null, error: null as null }),
    bookingRequest.lead_id
      ? admin.from("patient_leads").select("*").eq("clinic_id", clinicId).eq("id", bookingRequest.lead_id).maybeSingle<PatientLead>()
      : Promise.resolve({ data: null as PatientLead | null, error: null as null }),
    bookingRequest.patient_id
      ? admin.from("patients").select("*").eq("clinic_id", clinicId).eq("id", bookingRequest.patient_id).maybeSingle<Patient>()
      : Promise.resolve({ data: null as Patient | null, error: null as null }),
    bookingRequest.call_id
      ? admin.from("recovery_workflows").select("*").eq("clinic_id", clinicId).eq("call_id", bookingRequest.call_id).maybeSingle<RecoveryWorkflow>()
      : Promise.resolve({ data: null as RecoveryWorkflow | null, error: null as null }),
    admin.from("appointments").select("*").eq("clinic_id", clinicId).eq("booking_request_id", bookingRequest.id).maybeSingle<Appointment>(),
  ]);

  return {
    appointment: appointment ?? null,
    bookingRequest,
    call: call ?? null,
    error: null as string | null,
    lead: lead ?? null,
    patient: patient ?? null,
    workflow: workflow ?? null,
  };
}

async function loadAppointmentContext(clinicId: string, appointmentId: string) {
  const admin = createSupabaseAdminClient();
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .maybeSingle<Appointment>();

  if (appointmentError || !appointment) {
    return { appointment: null, bookingRequest: null, call: null, error: appointmentError?.message ?? "Appointment not found.", lead: null, patient: null, workflow: null };
  }

  const [{ data: bookingRequest }, { data: call }, { data: lead }, { data: patient }, { data: workflow }] = await Promise.all([
    appointment.booking_request_id
      ? admin.from("booking_requests").select("*").eq("clinic_id", clinicId).eq("id", appointment.booking_request_id).maybeSingle<BookingRequest>()
      : Promise.resolve({ data: null as BookingRequest | null, error: null as null }),
    appointment.call_id
      ? admin.from("calls").select("*").eq("clinic_id", clinicId).eq("id", appointment.call_id).maybeSingle<Call>()
      : Promise.resolve({ data: null as Call | null, error: null as null }),
    appointment.lead_id
      ? admin.from("patient_leads").select("*").eq("clinic_id", clinicId).eq("id", appointment.lead_id).maybeSingle<PatientLead>()
      : Promise.resolve({ data: null as PatientLead | null, error: null as null }),
    appointment.patient_phone
      ? admin.from("patients").select("*").eq("clinic_id", clinicId).eq("phone", appointment.patient_phone).maybeSingle<Patient>()
      : Promise.resolve({ data: null as Patient | null, error: null as null }),
    appointment.call_id
      ? admin.from("recovery_workflows").select("*").eq("clinic_id", clinicId).eq("call_id", appointment.call_id).maybeSingle<RecoveryWorkflow>()
      : Promise.resolve({ data: null as RecoveryWorkflow | null, error: null as null }),
  ]);

  return {
    appointment,
    bookingRequest: bookingRequest ?? null,
    call: call ?? null,
    error: null as string | null,
    lead: lead ?? null,
    patient: patient ?? null,
    workflow: workflow ?? null,
  };
}

async function goToReception(status: string) {
  revalidateReceptionRoutes();
  redirect(`/reception?status=${status}`);
}

function buildSimulationSmsBody(reference: string, target: "appointment" | "request", slotLabel?: string | null) {
  if (target === "appointment" && slotLabel) {
    return `Your appointment request is confirmed for ${slotLabel}. Reference: ${reference}.`;
  }

  return `Thanks for your booking request. The practice will confirm the exact time shortly. Reference: ${reference}.`;
}

async function appointmentConfirmationSmsAlreadyExists(input: { appointmentId: string | null; bookingReference: string | null; clinicId: string }) {
  if (!input.appointmentId && !input.bookingReference) {
    return false;
  }

  const admin = createSupabaseAdminClient();
  const byAppointment = input.appointmentId
    ? await admin
        .from("sms_events")
        .select("id")
        .eq("clinic_id", input.clinicId)
        .eq("direction", "outbound")
        .eq("appointment_id", input.appointmentId)
        .limit(1)
        .maybeSingle<{ id: string }>()
    : { data: null, error: null };

  if (byAppointment.data) {
    return true;
  }

  const byReference = input.bookingReference
    ? await admin
        .from("sms_events")
        .select("id")
        .eq("clinic_id", input.clinicId)
        .eq("direction", "outbound")
        .eq("booking_reference", input.bookingReference)
        .limit(1)
        .maybeSingle<{ id: string }>()
    : { data: null, error: null };

  return Boolean(byReference.data);
}

async function loadClinicNumberHash(admin: ReturnType<typeof createSupabaseAdminClient>, clinicId: string, callId: string | null) {
  if (!callId) {
    return null;
  }

  const { data: call } = await admin
    .from("calls")
    .select("clinic_number")
    .eq("clinic_id", clinicId)
    .eq("id", callId)
    .maybeSingle<Pick<Call, "clinic_number">>();

  return hashPhoneNumber(call?.clinic_number ?? null);
}

export async function confirmReceptionBookingRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/reception");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/reception?status=not-authorised");
  }

  const bookingRequestId = String(formData.get("booking_request_id") ?? "").trim();
  if (!bookingRequestId) {
    redirect("/reception?status=missing-booking-request");
  }

  const context = await loadBookingRequestContext(membership.clinic_id, bookingRequestId);
  if (context.error || !context.bookingRequest) {
    redirect("/reception?status=missing-booking-request");
  }

  if (context.appointment?.status === "confirmed") {
    redirect("/reception?status=already-confirmed");
  }

  const result = await confirmCalendarBookingRequest({
    bookingRequest: context.bookingRequest,
    call: context.call,
    clinicId: membership.clinic_id,
    createdByUserId: user.id,
    emergency: /emergency/i.test(context.bookingRequest.booking_type) || /urgent/i.test(context.bookingRequest.next_step ?? "") || /urgent/i.test(context.bookingRequest.notes ?? ""),
    lead: context.lead,
    notes: context.bookingRequest.notes ?? context.bookingRequest.next_step ?? context.bookingRequest.booking_type,
    patient: context.patient,
    preferredTime: context.bookingRequest.preferred_time,
    source: "dashboard",
    treatmentType: context.bookingRequest.booking_type,
    updatedByUserId: user.id,
    workflow: context.workflow,
  });

  if (result.error) {
    revalidateReceptionRoutes();
    redirect("/reception?status=confirm-error");
  }

  await goToReception(result.confirmed ? "confirmed" : "slot-unavailable");
}

export async function markReceptionBookingRequestContactedAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/reception");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/reception?status=not-authorised");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const bookingRequestId = String(formData.get("booking_request_id") ?? "").trim();
  const leadId = String(formData.get("lead_id") ?? "").trim();
  const callId = String(formData.get("call_id") ?? "").trim();

  if (bookingRequestId) {
    const context = await loadBookingRequestContext(membership.clinic_id, bookingRequestId);
    if (context.error || !context.bookingRequest) {
      redirect("/reception?status=missing-booking-request");
    }

    await admin
      .from("booking_requests")
      .update({
        next_step: "Reception has contacted the patient.",
        updated_at: now,
      })
      .eq("id", context.bookingRequest.id)
      .eq("clinic_id", membership.clinic_id);

    if (context.lead) {
      await admin
        .from("patient_leads")
        .update({
          status: "contacted",
          updated_at: now,
        })
        .eq("id", context.lead.id)
        .eq("clinic_id", membership.clinic_id);
    }

    if (context.call) {
      await admin
        .from("calls")
        .update({
          recovery_next_action: "Reception contacted the patient.",
          recovery_status: "closed",
          recovery_updated_at: now,
          updated_at: now,
        })
        .eq("id", context.call.id)
        .eq("clinic_id", membership.clinic_id);
    }
  } else {
    if (leadId) {
      await admin
        .from("patient_leads")
        .update({
          status: "contacted",
          updated_at: now,
        })
        .eq("id", leadId)
        .eq("clinic_id", membership.clinic_id);
    }

    if (callId) {
      await admin
        .from("calls")
        .update({
          recovery_next_action: "Reception contacted the caller.",
          recovery_status: "closed",
          recovery_updated_at: now,
          updated_at: now,
        })
        .eq("id", callId)
        .eq("clinic_id", membership.clinic_id);
    }
  }

  revalidateReceptionRoutes();
  redirect("/reception?status=contacted");
}

export async function markReceptionBookingRequestLostAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/reception");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/reception?status=not-authorised");
  }

  const bookingRequestId = String(formData.get("booking_request_id") ?? "").trim();
  const leadId = String(formData.get("lead_id") ?? "").trim();
  const callId = String(formData.get("call_id") ?? "").trim();

  if (!bookingRequestId && !leadId && !callId) {
    redirect("/reception?status=missing-item");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  if (bookingRequestId) {
    await admin
      .from("booking_requests")
      .update({
        next_step: "Marked as lost by reception.",
        status: "failed",
        updated_at: now,
      })
      .eq("id", bookingRequestId)
      .eq("clinic_id", membership.clinic_id);
  }

  if (leadId) {
    await admin
      .from("patient_leads")
      .update({
        loss_reason: "Marked lost by reception.",
        status: "lost",
        updated_at: now,
      })
      .eq("id", leadId)
      .eq("clinic_id", membership.clinic_id);
  }

  if (callId) {
    await admin
      .from("calls")
      .update({
        recovery_next_action: "Marked lost by reception.",
        recovery_status: "lost",
        recovery_updated_at: now,
        updated_at: now,
      })
      .eq("id", callId)
      .eq("clinic_id", membership.clinic_id);
  }

  if (bookingRequestId) {
    const { data: appointment } = await admin
      .from("appointments")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("booking_request_id", bookingRequestId)
      .maybeSingle<Appointment>();

    if (appointment) {
      await admin
        .from("appointments")
        .update({
          status: "cancelled",
          updated_at: now,
        })
        .eq("id", appointment.id)
        .eq("clinic_id", membership.clinic_id);
    }
  }

  revalidateReceptionRoutes();
  redirect("/reception?status=lost");
}

export async function markReceptionAppointmentRescheduleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/reception");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/reception?status=not-authorised");
  }

  const appointmentId = String(formData.get("appointment_id") ?? "").trim();
  if (!appointmentId) {
    redirect("/reception?status=missing-appointment");
  }

  const context = await loadAppointmentContext(membership.clinic_id, appointmentId);
  if (context.error || !context.appointment) {
    redirect("/reception?status=missing-appointment");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("appointments")
    .update({
      status: "reschedule_needed",
      updated_at: now,
    })
    .eq("id", context.appointment.id)
    .eq("clinic_id", membership.clinic_id);

  if (context.bookingRequest) {
    await admin
      .from("booking_requests")
      .update({
        next_step: "Reception marked this appointment for rescheduling.",
        status: "requested",
        updated_at: now,
      })
      .eq("id", context.bookingRequest.id)
      .eq("clinic_id", membership.clinic_id);
  }

  if (context.lead) {
    await admin
      .from("patient_leads")
      .update({
        status: "contacted",
        updated_at: now,
      })
      .eq("id", context.lead.id)
      .eq("clinic_id", membership.clinic_id);
  }

  revalidateReceptionRoutes();
  redirect("/reception?status=reschedule-needed");
}

export async function sendReceptionSmsConfirmationSimulationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/reception");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/reception?status=not-authorised");
  }

  const bookingRequestId = String(formData.get("booking_request_id") ?? "").trim();
  const appointmentId = String(formData.get("appointment_id") ?? "").trim();
  const callIdFallback = String(formData.get("call_id") ?? "").trim();
  const leadIdFallback = String(formData.get("lead_id") ?? "").trim();

  if (!bookingRequestId && !appointmentId && !callIdFallback && !leadIdFallback) {
    redirect("/reception?status=missing-item");
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  let confirmationReference: string | null = null;
  let callId: string | null = null;
  let leadId: string | null = null;
  let body = "Thanks for your booking request. The practice will confirm the exact time shortly.";
  let toNumberLast4: string | null = null;
  let fromNumberHash: string | null = null;
  let toNumberHash: string | null = null;

  if (appointmentId) {
    const { data: appointment } = await admin
      .from("appointments")
      .select("*")
      .eq("clinic_id", membership.clinic_id)
      .eq("id", appointmentId)
      .maybeSingle<Appointment>();

    if (!appointment) {
      redirect("/reception?status=missing-appointment");
    }

    confirmationReference = appointment.confirmation_reference;
    callId = appointment.call_id ?? null;
    leadId = appointment.lead_id ?? null;
    if (await appointmentConfirmationSmsAlreadyExists({ appointmentId: appointment.id, bookingReference: appointment.confirmation_reference, clinicId: membership.clinic_id })) {
      redirect("/reception?status=sms-sent");
    }

    body = buildAppointmentConfirmationSmsBody({
      appointmentStart: appointment.appointment_start,
      confirmationReference: appointment.confirmation_reference,
    });
    const normalizedPhone = appointment.patient_phone?.replace(/\D/g, "") ?? null;
    toNumberLast4 = normalizedPhone?.slice(-4) ?? null;
    toNumberHash = hashPhoneNumber(normalizedPhone);
    fromNumberHash = await loadClinicNumberHash(admin, membership.clinic_id, callId);
  } else if (bookingRequestId) {
    const context = await loadBookingRequestContext(membership.clinic_id, bookingRequestId);
    if (context.error || !context.bookingRequest) {
      redirect("/reception?status=missing-booking-request");
    }

    confirmationReference = context.bookingRequest.confirmation_reference;
    callId = context.bookingRequest.call_id ?? null;
    leadId = context.bookingRequest.lead_id ?? null;
    body = buildSimulationSmsBody(context.bookingRequest.confirmation_reference, "request");
    const normalizedPhone = context.patient?.phone?.replace(/\D/g, "") ?? null;
    toNumberLast4 = normalizedPhone?.slice(-4) ?? null;
    toNumberHash = hashPhoneNumber(normalizedPhone);
    fromNumberHash = await loadClinicNumberHash(admin, membership.clinic_id, callId);
  } else {
    const callRecord = callIdFallback
      ? await admin.from("calls").select("*").eq("clinic_id", membership.clinic_id).eq("id", callIdFallback).maybeSingle<Call>()
      : { data: null as Call | null, error: null as null };
    const leadRecord = leadIdFallback
      ? await admin.from("patient_leads").select("*").eq("clinic_id", membership.clinic_id).eq("id", leadIdFallback).maybeSingle<PatientLead>()
      : { data: null as PatientLead | null, error: null as null };

    callId = callRecord.data?.id ?? callIdFallback ?? null;
    leadId = leadRecord.data?.id ?? leadIdFallback ?? null;
    confirmationReference = `REC-${(callId ?? leadId ?? "SIM").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;
    body = `Thanks for contacting ClinicFlow. We've logged your request and the practice will confirm the next step shortly. Reference: ${confirmationReference}.`;
    toNumberLast4 = callRecord.data?.caller_number_last4 ?? null;
    toNumberHash = hashPhoneNumber(callRecord.data?.caller_number_hash ?? null);
    fromNumberHash = await loadClinicNumberHash(admin, membership.clinic_id, callId);
  }

  const { error } = await admin.from("sms_events").insert({
    appointment_id: appointmentId || null,
    booking_reference: confirmationReference,
    body_preview: body,
    call_id: callId,
    clinic_id: membership.clinic_id,
    direction: "outbound",
    from_number_hash: fromNumberHash,
    lead_id: leadId,
    occurred_at: now,
    provider: "manual",
    provider_message_id: `reception-sim-${confirmationReference ?? appointmentId ?? bookingRequestId}`,
    recovery_workflow_id: null,
    status: "delivered",
    to_number_hash: toNumberHash,
    to_number_last4: toNumberLast4,
  });

  if (error) {
    redirect("/reception?status=sms-error");
  }

  revalidateReceptionRoutes();
  redirect("/reception?status=sms-sent");
}
