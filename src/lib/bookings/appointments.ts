import type { Appointment, BookingRequest, Call, Inserts, Patient, PatientLead, RecoveryWorkflow, SmsEvent } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bookingRequestSummary, createOrUpdateBookingRequest } from "@/lib/bookings/requests";
import { hashPhoneNumber, normalizePhoneNumber } from "@/lib/twilio/crypto";
import { isMissingRelationError, logTwilioDbWriteFailure } from "@/lib/twilio/db-write";

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
  preferredTime?: string | null;
  source: CalendarBookingSource;
  treatmentType: string;
  updatedByUserId?: string | null;
  workflow?: RecoveryWorkflow | null;
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
  preferredTime?: string | null;
  source: CalendarBookingSource;
  treatmentType: string;
  updatedByUserId?: string | null;
  workflow?: RecoveryWorkflow | null;
};

function formatTimeZoneDateParts(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    weekday: "short",
    year: "numeric",
  });

  const parts = formatter.formatToParts(value).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});

  return {
    day: Number(parts.day ?? "0"),
    hour: Number(parts.hour ?? "0"),
    minute: Number(parts.minute ?? "0"),
    month: Number(parts.month ?? "0"),
    weekday: parts.weekday ?? "Mon",
    year: Number(parts.year ?? "1970"),
  };
}

function safeSlotSearch(input: BookingScheduleInput) {
  return findNextAvailableAppointmentSlot(input).catch((error) => {
    logTwilioDbWriteFailure("appointment_slot_search_failed", error, {
      clinicId: input.clinicId,
      operation: "select",
      table: "appointments",
    });
    return null;
  });
}

function getWeekdayIndex(weekday: string) {
  const lower = weekday.toLowerCase();
  if (lower.startsWith("mon")) return 1;
  if (lower.startsWith("tue")) return 2;
  if (lower.startsWith("wed")) return 3;
  if (lower.startsWith("thu")) return 4;
  if (lower.startsWith("fri")) return 5;
  if (lower.startsWith("sat")) return 6;
  return 0;
}

function isBusinessDay(value: Date, timeZone: string) {
  const weekday = getWeekdayIndex(formatTimeZoneDateParts(value, timeZone).weekday);
  return weekday >= 1 && weekday <= 5;
}

function isWithinBusinessHours(value: Date, timeZone: string) {
  const parts = formatTimeZoneDateParts(value, timeZone);
  const minutes = parts.hour * 60 + parts.minute;
  return minutes >= 9 * 60 && minutes < 17 * 60;
}

function roundUpToNextSlot(value: Date, intervalMinutes = 30) {
  const rounded = new Date(value.getTime());
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const remainder = minutes % intervalMinutes;
  if (remainder === 0) {
    return rounded;
  }

  rounded.setMinutes(minutes + (intervalMinutes - remainder));
  return rounded;
}

function appointmentLabel(value: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(value);
}

function appointmentOverlaps(candidateStart: Date, candidateEnd: Date, start: string, end: string) {
  const existingStart = new Date(start);
  const existingEnd = new Date(end);
  return candidateStart < existingEnd && candidateEnd > existingStart;
}

async function resolveClinicTimeZone(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("clinics").select("timezone").eq("id", clinicId).maybeSingle<{ timezone: string | null }>();

  if (error || !data?.timezone) {
    return "Europe/London";
  }

  return data.timezone;
}

async function loadConfirmedAppointments(input: BookingScheduleInput) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("appointment_end, appointment_start")
    .eq("clinic_id", input.clinicId)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .order("appointment_start", { ascending: true })
    .returns<Array<Pick<Appointment, "appointment_end" | "appointment_start">>>();

  if (error) {
    if (isMissingRelationError(error)) {
      logTwilioDbWriteFailure("appointment_table_missing", error, {
        clinicId: input.clinicId,
        operation: "select",
        table: "appointments",
      });
      return [];
    }

    throw error;
  }

  return data ?? [];
}

export async function findNextAvailableAppointmentSlot(input: BookingScheduleInput) {
  const timezone = input.timezone ?? (await resolveClinicTimeZone(input.clinicId));
  const confirmedAppointments = await loadConfirmedAppointments(input);
  const durationMinutes = input.durationMinutes ?? 30;
  const now = roundUpToNextSlot(new Date(), durationMinutes);
  const searchEnd = new Date(now.getTime() + (input.emergency ? 24 : 21) * 60 * 60 * 1000);
  const slotMillis = durationMinutes * 60 * 1000;

  for (let candidate = new Date(now); candidate <= searchEnd; candidate = new Date(candidate.getTime() + slotMillis)) {
    if (!isBusinessDay(candidate, timezone) || !isWithinBusinessHours(candidate, timezone)) {
      continue;
    }

    const candidateEnd = new Date(candidate.getTime() + slotMillis);
    const available = !confirmedAppointments.some((appointment) =>
      appointmentOverlaps(candidate, candidateEnd, appointment.appointment_start, appointment.appointment_end),
    );

    if (!available) {
      continue;
    }

    return {
      endAt: candidateEnd.toISOString(),
      label: appointmentLabel(candidate, timezone),
      startAt: candidate.toISOString(),
    };
  }

  return null;
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
  const body = `Your appointment request is confirmed for ${input.slotLabel}. Reference: ${input.confirmationReference}.`;
  const { error } = await admin.from("sms_events").insert({
    body_preview: body,
    call_id: input.call?.id ?? null,
    clinic_id: input.clinicId,
    direction: "outbound",
    from_number_hash: input.call?.clinic_number ? hashPhoneNumber(input.call.clinic_number) : null,
    lead_id: input.appointment.lead_id ?? input.call?.lead_id ?? null,
    occurred_at: new Date().toISOString(),
    provider: "manual",
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
  const patientPhone = normalizePhoneNumber(input.patient?.phone ?? null);
  const timezone = await resolveClinicTimeZone(input.clinicId);
  const slot = await safeSlotSearch({
    clinicId: input.clinicId,
    emergency: input.emergency,
    preferredTimeText: input.preferredTime,
    timezone,
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
  if (slot) {
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
  const patientPhone = normalizePhoneNumber(input.patient?.phone ?? null);
  const timezone = await resolveClinicTimeZone(input.clinicId);
  const slot = await safeSlotSearch({
    clinicId: input.clinicId,
    emergency: input.emergency,
    preferredTimeText: input.preferredTime,
    timezone,
  });

  let appointment: Appointment | null = null;
  let confirmed = false;

  if (slot) {
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
