import type { Appointment, BookingRequest, Call, Inserts, Patient, PatientLead, RecoveryWorkflow, SmsEvent } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bookingRequestSummary, createOrUpdateBookingRequest } from "@/lib/bookings/requests";
import { getCalendarAvailabilityForClinic, syncCalendarBookingCreation } from "@/lib/integrations/calendar/service";
import { hashPhoneNumber, normalizePhoneNumber } from "@/lib/twilio/crypto";
import { getTwilioConnectionForClinic } from "@/lib/twilio/config";
import { isMissingRelationError, logTwilioDbWriteFailure } from "@/lib/twilio/db-write";
import { hasConfiguredTwilioSmsSender, sendConfiguredTwilioSms } from "@/lib/twilio/sms";

export type CalendarBookingSource = "ai_call" | "manual" | "dashboard";

export type CalendarBookingResult = {
  appointment: Appointment | null;
  bookingRequest: BookingRequest | null;
  confirmed: boolean;
  error: string | null;
  slot: { endAt: string; startAt: string; label: string } | null;
};

type BookingScheduleInput = {
  clinicId: string;
  emergency?: boolean;
  durationMinutes?: number;
  preferredTimeText?: string | null;
  timezone?: string | null;
};

type CalendarBookingInput = {
  bookingType: string;
  call: Call;
  clinicId: string;
  createdByUserId?: string | null;
  emergency?: boolean;
  lead?: PatientLead | null;
  nextStep: string;
  notes: string;
  patient?: Patient | null;
  patientPhoneOverride?: string | null;
  preferredTime?: string | null;
  source: CalendarBookingSource;
  treatmentType: string;
  updatedByUserId?: string | null;
  workflow?: RecoveryWorkflow | null;
  forceRequestOnly?: boolean;
};

export type BookingRequestAppointmentInput = {
  bookingRequest: BookingRequest;
  call?: Call | null;
  clinicId: string;
  createdByUserId?: string | null;
  emergency?: boolean;
  lead?: PatientLead | null;
  notes: string;
  patient?: Patient | null;
  patientPhoneOverride?: string | null;
  preferredTime?: string | null;
  source: CalendarBookingSource;
  treatmentType: string;
  updatedByUserId?: string | null;
  workflow?: RecoveryWorkflow | null;
  forceRequestOnly?: boolean;
};

function safeSlotSearch(input: BookingScheduleInput) {
  return getCalendarAvailabilityForClinic({ ...input, clinicId: input.clinicId }).catch((error) => {
    logTwilioDbWriteFailure("appointment_slot_search_failed", error, {
      clinicId: input.clinicId,
      operation: "select",
      table: "appointments",
    });
    return null;
  }).then((result) => result?.slot ?? null);
}

export async function findNextAvailableAppointmentSlot(input: BookingScheduleInput) {
  const result = await getCalendarAvailabilityForClinic({
    clinicId: input.clinicId,
    durationMinutes: input.durationMinutes,
    emergency: input.emergency,
    preferredTimeText: input.preferredTimeText,
    timezone: input.timezone,
  });

  return result.slot
    ? {
        endAt: result.slot.endAt,
        label: result.slot.label,
        startAt: result.slot.startAt,
      }
    : null;
}

async function recordAppointmentConfirmationSms(input: {
  appointment: Appointment;
  call?: Call | null;
  clinicId: string;
  confirmationReference: string;
  patientPhone: string | null;
  slotLabel: string;
}) {
  const admin = createSupabaseAdminClient();
  const smsSendingEnabled = hasConfiguredTwilioSmsSender();
  const body = `Your appointment is confirmed for ${input.slotLabel}. Reference: ${input.confirmationReference}. Reply CANCEL if you need to cancel.`;
  const { error } = await admin.from("sms_events").insert({
    body_preview: body,
    call_id: input.call?.id ?? null,
    clinic_id: input.clinicId,
    direction: "outbound",
    from_number_hash: input.call?.clinic_number ? hashPhoneNumber(input.call.clinic_number) : null,
    lead_id: input.appointment.lead_id ?? input.call?.lead_id ?? null,
    occurred_at: new Date().toISOString(),
    provider: smsSendingEnabled ? "twilio" : "manual",
    provider_message_id: `appointment-confirmation-${input.appointment.id}`,
    recovery_workflow_id: null,
    status: "queued",
    to_number_hash: input.patientPhone ? hashPhoneNumber(input.patientPhone) : null,
    to_number_last4: normalizePhoneNumber(input.patientPhone)?.slice(-4) ?? null,
  } satisfies Partial<SmsEvent>);

  if (error) {
    logTwilioDbWriteFailure("appointment_confirmation_sms_failed", error, {
      appointmentId: input.appointment.id,
      clinicId: input.clinicId,
      operation: "insert",
      table: "sms_events",
    });
    return;
  }

  const { connection } = await getTwilioConnectionForClinic(input.clinicId);
  if (!connection) {
    return;
  }

  if (!hasConfiguredTwilioSmsSender()) {
    return;
  }

  const sendResult = await sendConfiguredTwilioSms({
    connection,
    body,
    to: input.patientPhone,
  });

  if (sendResult.error) {
    const { error: smsUpdateError } = await admin
      .from("sms_events")
      .update({
        error_message: sendResult.error,
        status: "failed",
      })
      .eq("clinic_id", input.clinicId)
      .eq("provider_message_id", `appointment-confirmation-${input.appointment.id}`);

    if (smsUpdateError) {
      logTwilioDbWriteFailure("appointment_confirmation_sms_status_update_failed", smsUpdateError, {
        appointmentId: input.appointment.id,
        clinicId: input.clinicId,
        operation: "update",
        table: "sms_events",
      });
    }

    return;
  }

  if (sendResult.messageSid) {
    const { error: smsUpdateError } = await admin
      .from("sms_events")
      .update({
        provider_message_id: sendResult.messageSid,
        status: "sent",
      })
      .eq("clinic_id", input.clinicId)
      .eq("provider_message_id", `appointment-confirmation-${input.appointment.id}`);

    if (smsUpdateError) {
      logTwilioDbWriteFailure("appointment_confirmation_sms_status_update_failed", smsUpdateError, {
        appointmentId: input.appointment.id,
        clinicId: input.clinicId,
        operation: "update",
        table: "sms_events",
      });
    }
  }
}

async function updateBookingArtifacts(input: {
  appointment: Appointment | null;
  bookingRequest: BookingRequest;
  call?: Call | null;
  confirmed: boolean;
  clinicId: string;
  lead?: PatientLead | null;
  workflow?: RecoveryWorkflow | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const nextAction = input.confirmed
    ? `Appointment confirmed for ${input.bookingRequest.confirmation_reference}.`
    : "The practice will confirm the exact time shortly.";
  const callStatus = input.confirmed ? "recovered" : "answered";
  const recoveryStatus = input.confirmed ? "booked" : "queued";
  const workflowState = input.confirmed ? "booked" : "awaiting_staff_approval";
  const leadStatus = input.confirmed ? "booked" : "contacted";

  if (input.call) {
    await admin
      .from("calls")
      .update({
        recovery_next_action: nextAction,
        recovery_status: recoveryStatus,
        recovery_updated_at: now,
        status: callStatus,
        updated_at: now,
      })
      .eq("id", input.call.id)
      .eq("clinic_id", input.clinicId);
  }

  if (input.lead) {
    await admin
      .from("patient_leads")
      .update({
        converted_at: input.confirmed ? now : input.lead.converted_at,
        next_follow_up_at: input.confirmed ? null : input.lead.next_follow_up_at,
        status: leadStatus,
        updated_at: now,
      })
      .eq("id", input.lead.id)
      .eq("clinic_id", input.clinicId);
  }

  if (input.workflow) {
    await admin
      .from("recovery_workflows")
      .update({
        current_step: input.confirmed ? Math.max(input.workflow.current_step ?? 1, 3) : input.workflow.current_step ?? 1,
        next_action_at: input.confirmed ? null : input.workflow.next_action_at,
        state: workflowState,
        updated_at: now,
      })
      .eq("id", input.workflow.id)
      .eq("clinic_id", input.clinicId);
  }
}

export async function bookCalendarAppointment(input: CalendarBookingInput): Promise<CalendarBookingResult> {
  const admin = createSupabaseAdminClient();
  const patientName = input.patient?.full_name ?? input.lead?.enquiry_summary?.split(".")[0]?.trim() ?? "Incoming caller";
  const patientEmail = input.patient?.email ?? null;
  const patientPhone = normalizePhoneNumber(input.patient?.phone ?? input.patientPhoneOverride ?? null);
  const slot = await safeSlotSearch({
    clinicId: input.clinicId,
    emergency: input.emergency,
    preferredTimeText: input.preferredTime,
  });

  const bookingRequest = await createOrUpdateBookingRequest({
    bookingType: input.bookingType,
    call: input.call,
    clinicId: input.clinicId,
    createdByUserId: input.createdByUserId,
    lead: input.lead,
    nextStep: "The practice will confirm the exact time shortly.",
    notes: bookingRequestSummary({
      bookingType: input.bookingType,
      call: input.call,
      clinicId: input.clinicId,
      lead: input.lead,
      nextStep: "The practice will confirm the exact time shortly.",
      notes: input.notes,
      patient: input.patient,
      preferredTime: input.preferredTime ?? null,
      source: input.source === "ai_call" ? "voice" : "manual",
    }),
    patient: input.patient,
    preferredTime: input.preferredTime ?? null,
    source: input.source === "ai_call" ? "voice" : "manual",
    status: "requested",
    updatedByUserId: input.updatedByUserId ?? input.createdByUserId,
  });

  if (bookingRequest.error || !bookingRequest.bookingRequest) {
    return {
      appointment: null,
      bookingRequest: null,
      confirmed: false,
      error: bookingRequest.error ?? "Unable to save the booking request.",
      slot: null,
    };
  }

  let appointment: Appointment | null = null;
  let confirmed = false;
  if (slot && !input.forceRequestOnly) {
    const appointmentPayload: Inserts<"appointments"> = {
      appointment_end: slot.endAt,
      appointment_start: slot.startAt,
      booking_request_id: bookingRequest.bookingRequest.id,
      call_id: input.call?.id ?? null,
      clinic_id: input.clinicId,
      confirmation_reference: bookingRequest.bookingRequest.confirmation_reference,
      created_by: input.createdByUserId ?? null,
      lead_id: input.lead?.id ?? input.call?.lead_id ?? null,
      notes: input.notes,
      patient_email: patientEmail,
      patient_name: patientName,
      patient_phone: patientPhone,
      source: input.source,
      status: "confirmed",
      treatment_type: input.treatmentType || "general",
      updated_by: input.updatedByUserId ?? input.createdByUserId ?? null,
    };

    const appointmentResult = await admin
      .from("appointments")
      .upsert(appointmentPayload, { onConflict: "booking_request_id" })
      .select("*")
      .single<Appointment>();

    if (appointmentResult.error) {
      if (isMissingRelationError(appointmentResult.error)) {
        logTwilioDbWriteFailure("appointment_write_table_missing", appointmentResult.error, {
          bookingRequestId: bookingRequest.bookingRequest.id,
          clinicId: input.clinicId,
          operation: "upsert",
          table: "appointments",
        });
      } else {
        return {
          appointment: null,
          bookingRequest: bookingRequest.bookingRequest,
          confirmed: false,
          error: appointmentResult.error.message,
          slot,
        };
      }
    } else {
      appointment = appointmentResult.data ?? null;
      confirmed = Boolean(appointment);

      if (appointment) {
        const { error: bookingUpdateError } = await admin
          .from("booking_requests")
          .update({
            next_step: `Appointment confirmed for ${slot.label}. Reference: ${bookingRequest.bookingRequest.confirmation_reference}.`,
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingRequest.bookingRequest.id)
          .eq("clinic_id", input.clinicId);

        if (bookingUpdateError) {
          logTwilioDbWriteFailure("booking_request_confirm_update_failed", bookingUpdateError, {
            bookingRequestId: bookingRequest.bookingRequest.id,
            clinicId: input.clinicId,
            operation: "update",
            table: "booking_requests",
          });
        }

        await recordAppointmentConfirmationSms({
          appointment,
          call: input.call,
          clinicId: input.clinicId,
          confirmationReference: bookingRequest.bookingRequest.confirmation_reference,
          patientPhone,
          slotLabel: slot.label,
        });

        await syncCalendarBookingCreation({
          appointment,
          bookingRequest: bookingRequest.bookingRequest,
          call: input.call ?? null,
          clinicId: input.clinicId,
          lead: input.lead ?? null,
          patient: input.patient ?? null,
          slot,
          source: input.source,
          treatmentType: input.treatmentType,
        });
      }
    }
  }

  await updateBookingArtifacts({
    appointment,
    bookingRequest: bookingRequest.bookingRequest,
    call: input.call,
    clinicId: input.clinicId,
    confirmed,
    lead: input.lead ?? null,
    workflow: input.workflow ?? null,
  });

  return {
    appointment,
    bookingRequest: bookingRequest.bookingRequest,
    confirmed,
    error: null,
    slot,
  };
}

export async function confirmCalendarBookingRequest(input: BookingRequestAppointmentInput): Promise<CalendarBookingResult> {
  const admin = createSupabaseAdminClient();
  const patientName = input.patient?.full_name ?? input.lead?.enquiry_summary?.split(".")[0]?.trim() ?? "Incoming caller";
  const patientEmail = input.patient?.email ?? null;
  const patientPhone = normalizePhoneNumber(input.patient?.phone ?? input.patientPhoneOverride ?? null);
  const slot = await safeSlotSearch({
    clinicId: input.clinicId,
    emergency: input.emergency,
    preferredTimeText: input.preferredTime,
  });

  let appointment: Appointment | null = null;
  let confirmed = false;

  if (slot && !input.forceRequestOnly) {
    const appointmentResult = await admin
      .from("appointments")
      .upsert(
        {
          appointment_end: slot.endAt,
          appointment_start: slot.startAt,
          booking_request_id: input.bookingRequest.id,
          call_id: input.call?.id ?? input.bookingRequest.call_id ?? null,
          clinic_id: input.clinicId,
          confirmation_reference: input.bookingRequest.confirmation_reference,
          created_by: input.createdByUserId ?? null,
          lead_id: input.lead?.id ?? input.call?.lead_id ?? input.bookingRequest.lead_id ?? null,
          notes: input.notes,
          patient_email: patientEmail,
          patient_name: patientName,
          patient_phone: patientPhone,
          source: input.source,
          status: "confirmed",
          treatment_type: input.treatmentType || "general",
          updated_by: input.updatedByUserId ?? input.createdByUserId ?? null,
        } satisfies Inserts<"appointments">,
        { onConflict: "booking_request_id" },
      )
      .select("*")
      .single<Appointment>();

    if (appointmentResult.error) {
      if (isMissingRelationError(appointmentResult.error)) {
        logTwilioDbWriteFailure("appointment_write_table_missing", appointmentResult.error, {
          bookingRequestId: input.bookingRequest.id,
          clinicId: input.clinicId,
          operation: "upsert",
          table: "appointments",
        });
      } else {
        return {
          appointment: null,
          bookingRequest: input.bookingRequest,
          confirmed: false,
          error: appointmentResult.error.message,
          slot,
        };
      }
    } else {
      appointment = appointmentResult.data ?? null;
      confirmed = Boolean(appointment);

      if (appointment) {
        const { error: bookingUpdateError } = await admin
          .from("booking_requests")
          .update({
            next_step: `Appointment confirmed for ${slot.label}. Reference: ${input.bookingRequest.confirmation_reference}.`,
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.bookingRequest.id)
          .eq("clinic_id", input.clinicId);

        if (bookingUpdateError) {
          logTwilioDbWriteFailure("booking_request_confirm_update_failed", bookingUpdateError, {
            bookingRequestId: input.bookingRequest.id,
            clinicId: input.clinicId,
            operation: "update",
            table: "booking_requests",
          });
        }

        await recordAppointmentConfirmationSms({
          appointment,
          call: input.call ?? null,
          clinicId: input.clinicId,
          confirmationReference: input.bookingRequest.confirmation_reference,
          patientPhone,
          slotLabel: slot.label,
        });

        await syncCalendarBookingCreation({
          appointment,
          bookingRequest: input.bookingRequest,
          call: input.call ?? null,
          clinicId: input.clinicId,
          lead: input.lead ?? null,
          patient: input.patient ?? null,
          slot,
          source: input.source,
          treatmentType: input.treatmentType,
        });
      }
    }
  }

  await updateBookingArtifacts({
    appointment,
    bookingRequest: input.bookingRequest,
    call: input.call ?? null,
    clinicId: input.clinicId,
    confirmed,
    lead: input.lead ?? null,
    workflow: input.workflow ?? null,
  });

  return {
    appointment,
    bookingRequest: input.bookingRequest,
    confirmed,
    error: null,
    slot,
  };
}

export function formatAppointmentSlotLabel(value: string, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timeZone ?? "Europe/London",
  }).format(new Date(value));
}
