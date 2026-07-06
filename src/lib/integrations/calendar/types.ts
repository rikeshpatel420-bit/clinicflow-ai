import type { Appointment, BookingRequest, Call, Patient, PatientLead } from "@/types/database";

export type CalendarProviderId = "dentally" | "soe" | "exact" | "google_calendar" | "microsoft_outlook";

export type CalendarProviderKind = "practice_management" | "calendar";

export type CalendarAvailabilityInput = {
  clinicId: string;
  durationMinutes?: number;
  emergency?: boolean;
  preferredTimeText?: string | null;
  timezone?: string | null;
};

export type CalendarAvailabilitySlot = {
  available: boolean;
  endAt: string;
  label: string;
  providerId: CalendarProviderId;
  source: "mock" | "shared";
  startAt: string;
  notes: string[];
};

export type CalendarAvailabilityResult = {
  providerId: CalendarProviderId;
  providerName: string;
  slot: CalendarAvailabilitySlot | null;
};

export type CalendarBookingSyncInput = {
  appointment: Appointment;
  bookingRequest: BookingRequest;
  call?: Call | null;
  clinicId: string;
  lead?: PatientLead | null;
  patient?: Patient | null;
  source: "ai_call" | "manual" | "dashboard";
  slot: CalendarAvailabilitySlot | null;
  treatmentType: string;
};

export type CalendarMutationInput = {
  appointment: Appointment;
  bookingRequest?: BookingRequest | null;
  call?: Call | null;
  clinicId: string;
  notes?: string | null;
  reason: string;
  source: "ai_call" | "manual" | "dashboard";
  treatmentType?: string | null;
};

export type CalendarMutationResult = {
  externalBookingId: string | null;
  message: string;
  providerId: CalendarProviderId;
  providerName: string;
  source: "mock";
  success: boolean;
};

export type CalendarProviderAdapter = {
  createBooking(input: CalendarBookingSyncInput): Promise<CalendarMutationResult>;
  cancelBooking(input: CalendarMutationInput): Promise<CalendarMutationResult>;
  getAvailability(input: CalendarAvailabilityInput): Promise<CalendarAvailabilityResult>;
  id: CalendarProviderId;
  kind: CalendarProviderKind;
  name: string;
  updateBooking(input: CalendarMutationInput): Promise<CalendarMutationResult>;
};
