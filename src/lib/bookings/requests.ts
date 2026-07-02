import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingRequest, Call, Patient, PatientLead, RecoveryWorkflow } from "@/types/database";
import { logTwilioDbWriteFailure } from "@/lib/twilio/db-write";

const BOOKING_REFERENCE_PREFIX = "CF";

export type BookingRequestSource = "voice" | "sms" | "manual" | "web";

export type BookingRequestInput = {
  bookingType: string;
  clinicId: string;
  call: Call;
  createdByUserId?: string | null;
  lead?: PatientLead | null;
  nextStep: string;
  notes: string;
  patient?: Patient | null;
  preferredTime?: string | null;
  source: BookingRequestSource;
  status?: BookingRequest["status"];
  workflow?: RecoveryWorkflow | null;
  updatedByUserId?: string | null;
};

export function buildBookingReference(input: { callId: string; clinicId: string; source?: BookingRequestSource }) {
  const hash = createHash("sha256")
    .update(`${input.clinicId}:${input.callId}:${input.source ?? "voice"}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  return `${BOOKING_REFERENCE_PREFIX}-${hash}`;
}

export function bookingRequestSummary(input: BookingRequestInput) {
  const caller = input.patient?.full_name ?? input.lead?.enquiry_summary ?? input.call.caller_number_last4 ?? "Caller";
  const preferredTime = input.preferredTime ? ` Preferred time: ${input.preferredTime}.` : "";
  const bookingType = input.bookingType.replace(/_/g, " ");

  return `${caller} requested a ${bookingType}.${preferredTime} Next step: ${input.nextStep}.`;
}

export async function createOrUpdateBookingRequest(input: BookingRequestInput) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const reference = buildBookingReference({
    callId: input.call.provider_call_id ?? input.call.id,
    clinicId: input.clinicId,
    source: input.source,
  });

  const { data: existingBooking, error: existingBookingError } = await admin
    .from("booking_requests")
    .select("*")
    .eq("clinic_id", input.clinicId)
    .eq("call_id", input.call.id)
    .maybeSingle<BookingRequest>();

  if (existingBookingError) {
    logTwilioDbWriteFailure("booking_request_lookup_failed", existingBookingError, {
      bookingReference: reference,
      callSid: input.call.provider_call_id ?? input.call.id,
      clinicId: input.clinicId,
      operation: "select",
      table: "booking_requests",
    });
    return { bookingRequest: null as BookingRequest | null, error: existingBookingError.message, reference };
  }

  const payload = {
    booking_type: input.bookingType,
    call_id: input.call.id,
    clinic_id: input.clinicId,
    confirmation_reference: reference,
    created_by: input.createdByUserId ?? null,
    lead_id: input.lead?.id ?? input.call.lead_id ?? null,
    next_step: input.nextStep,
    notes: input.notes,
    patient_id: input.patient?.id ?? null,
    preferred_time: input.preferredTime ?? null,
    requested_at: now,
    source: input.source,
    status: input.status ?? "requested",
    updated_by: input.updatedByUserId ?? input.createdByUserId ?? null,
    updated_at: now,
  };

  const bookingResult = existingBooking
    ? await admin
        .from("booking_requests")
        .update({
          ...payload,
          status: existingBooking.status === "confirmed" ? "confirmed" : payload.status,
        })
        .eq("id", existingBooking.id)
        .eq("clinic_id", input.clinicId)
        .select("*")
        .single<BookingRequest>()
    : await admin
        .from("booking_requests")
        .insert(payload)
        .select("*")
        .single<BookingRequest>();

  if (bookingResult.error) {
    logTwilioDbWriteFailure(existingBooking ? "booking_request_update_failed" : "booking_request_insert_failed", bookingResult.error, {
      bookingReference: reference,
      callSid: input.call.provider_call_id ?? input.call.id,
      clinicId: input.clinicId,
      operation: existingBooking ? "update" : "insert",
      table: "booking_requests",
    });
    return { bookingRequest: null as BookingRequest | null, error: bookingResult.error.message, reference };
  }

  return { bookingRequest: bookingResult.data ?? existingBooking ?? null, error: null, reference };
}
