"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { confirmCalendarBookingRequest } from "@/lib/bookings/appointments";
import { syncCalendarBookingCancellation, syncCalendarBookingUpdate } from "@/lib/integrations/calendar/service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Appointment, BookingRequest, Call, Patient, PatientLead, RecoveryWorkflow } from "@/types/database";

function mustBeOwnerOrAdmin(role?: string | null) {
  return role === "owner" || role === "admin";
}

async function revalidateCalendarRoutes() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/calls");
  revalidatePath("/patients");
}

async function loadCalendarContext(clinicId: string, bookingRequestId: string) {
  const admin = createSupabaseAdminClient();
  const { data: bookingRequest, error: bookingRequestError } = await admin
    .from("booking_requests")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("id", bookingRequestId)
    .is("deleted_at", null)
    .maybeSingle<BookingRequest>();

  if (bookingRequestError || !bookingRequest) {
    return { bookingRequest: null, call: null, error: bookingRequestError?.message ?? "Booking request not found.", lead: null, patient: null, workflow: null };
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

export async function confirmBookingRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/calendar");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/calendar?status=not-authorised");
  }

  const bookingRequestId = String(formData.get("booking_request_id") ?? "").trim();
  if (!bookingRequestId) {
    redirect("/calendar?status=missing-booking-request");
  }

  const context = await loadCalendarContext(membership.clinic_id, bookingRequestId);
  if (context.error || !context.bookingRequest) {
    redirect("/calendar?status=missing-booking-request");
  }

  if (context.appointment?.status === "confirmed") {
    redirect("/calendar?status=already-confirmed");
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

  await revalidateCalendarRoutes();

  if (result.error) {
    redirect("/calendar?status=confirm-error");
  }

  redirect(result.confirmed ? "/calendar?status=confirmed" : "/calendar?status=slot-unavailable");
}

export async function markBookingRequestContactedAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/calendar");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/calendar?status=not-authorised");
  }

  const bookingRequestId = String(formData.get("booking_request_id") ?? "").trim();
  if (!bookingRequestId) {
    redirect("/calendar?status=missing-booking-request");
  }

  const admin = createSupabaseAdminClient();
  const { data: bookingRequest, error } = await admin
    .from("booking_requests")
    .select("*")
    .eq("clinic_id", membership.clinic_id)
    .eq("id", bookingRequestId)
    .is("deleted_at", null)
    .maybeSingle<BookingRequest>();

  if (error || !bookingRequest) {
    redirect("/calendar?status=missing-booking-request");
  }

  await admin
    .from("booking_requests")
    .update({
      next_step: "Reception has contacted the patient.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingRequest.id)
    .eq("clinic_id", membership.clinic_id);

  if (bookingRequest.lead_id) {
    await admin
      .from("patient_leads")
      .update({
        status: "contacted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingRequest.lead_id)
      .eq("clinic_id", membership.clinic_id);
  }

  await revalidateCalendarRoutes();
  redirect("/calendar?status=contacted");
}

export async function cancelAppointmentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/calendar");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/calendar?status=not-authorised");
  }

  const appointmentId = String(formData.get("appointment_id") ?? "").trim();
  if (!appointmentId) {
    redirect("/calendar?status=missing-appointment");
  }

  const admin = createSupabaseAdminClient();
  const { data: appointment, error } = await admin
    .from("appointments")
    .select("*")
    .eq("clinic_id", membership.clinic_id)
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .maybeSingle<Appointment>();

  if (error || !appointment) {
    redirect("/calendar?status=missing-appointment");
  }

  await admin
    .from("appointments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointment.id)
    .eq("clinic_id", membership.clinic_id);

  await syncCalendarBookingCancellation({
    appointment,
    bookingRequest: null,
    clinicId: membership.clinic_id,
    notes: "Cancelled from the calendar dashboard.",
    reason: "dashboard_cancelled",
    source: "dashboard",
    treatmentType: appointment.treatment_type,
  });

  if (appointment.booking_request_id) {
    await admin
      .from("booking_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.booking_request_id)
      .eq("clinic_id", membership.clinic_id);
  }

  await revalidateCalendarRoutes();
  redirect("/calendar?status=cancelled");
}

export async function markAppointmentRescheduleNeededAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/calendar");
  }

  const membership = await getActiveClinicMembershipForUser(user);
  if (!membership || !mustBeOwnerOrAdmin(membership.role)) {
    redirect("/calendar?status=not-authorised");
  }

  const appointmentId = String(formData.get("appointment_id") ?? "").trim();
  if (!appointmentId) {
    redirect("/calendar?status=missing-appointment");
  }

  const admin = createSupabaseAdminClient();
  const { data: appointment, error } = await admin
    .from("appointments")
    .select("*")
    .eq("clinic_id", membership.clinic_id)
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .maybeSingle<Appointment>();

  if (error || !appointment) {
    redirect("/calendar?status=missing-appointment");
  }

  await admin
    .from("appointments")
    .update({
      status: "reschedule_needed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointment.id)
    .eq("clinic_id", membership.clinic_id);

  await syncCalendarBookingUpdate({
    appointment,
    bookingRequest: null,
    clinicId: membership.clinic_id,
    notes: "Reschedule needed from the calendar dashboard.",
    reason: "dashboard_reschedule_needed",
    source: "dashboard",
    treatmentType: appointment.treatment_type,
  });

  if (appointment.booking_request_id) {
    await admin
      .from("booking_requests")
      .update({
        next_step: "Reschedule needed.",
        status: "requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.booking_request_id)
      .eq("clinic_id", membership.clinic_id);
  }

  await revalidateCalendarRoutes();
  redirect("/calendar?status=reschedule-needed");
}
