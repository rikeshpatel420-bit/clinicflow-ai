import { getClinicSettingsSnapshot } from "@/lib/settings/store";
import { logTwilioDbWriteFailure } from "@/lib/twilio/db-write";
import { findSharedNextAvailableAppointmentSlot } from "./shared";
import { getCalendarProviderDefinition, resolveCalendarProviderId } from "./registry";
import type {
  CalendarAvailabilityInput,
  CalendarAvailabilityResult,
  CalendarMutationInput,
  CalendarMutationResult,
  CalendarProviderAdapter,
  CalendarProviderId,
  CalendarBookingSyncInput,
} from "./types";

type ClinicCalendarSelection = {
  providerId: CalendarProviderId;
};

function buildMockBookingReference(providerId: CalendarProviderId, value: string) {
  return `${providerId.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${value.replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase()}`;
}

async function resolveClinicCalendarSelection(clinicId: string): Promise<ClinicCalendarSelection> {
  try {
    const snapshot = await getClinicSettingsSnapshot(clinicId);
    const configuredProvider =
      snapshot.clinic.business_configuration.workflowSettings.calendarProvider ||
      snapshot.clinic.business_configuration.calendarSettings.provider ||
      "Google Calendar";
    const providerId = resolveCalendarProviderId(configuredProvider);
    return { providerId };
  } catch {
    return { providerId: "google_calendar" };
  }
}

function createMockCalendarProvider(providerId: CalendarProviderId): CalendarProviderAdapter {
  const definition = getCalendarProviderDefinition(providerId);

  return {
    id: providerId,
    kind: definition.kind,
    name: definition.name,
    async getAvailability(input: CalendarAvailabilityInput): Promise<CalendarAvailabilityResult> {
      const slot = await findSharedNextAvailableAppointmentSlot({
        ...input,
        providerId,
      });

      return {
        providerId,
        providerName: definition.name,
        slot: slot
          ? {
              ...slot,
              providerId,
            }
          : null,
      };
    },
    async createBooking(input: CalendarBookingSyncInput): Promise<CalendarMutationResult> {
      const reference = buildMockBookingReference(providerId, input.bookingRequest.confirmation_reference || input.appointment.id);
      return {
        externalBookingId: reference,
        message: `${definition.name} accepted booking ${reference}.`,
        providerId,
        providerName: definition.name,
        source: "mock",
        success: true,
      };
    },
    async cancelBooking(input: CalendarMutationInput): Promise<CalendarMutationResult> {
      const reference = buildMockBookingReference(providerId, input.appointment.confirmation_reference || input.appointment.id);
      return {
        externalBookingId: reference,
        message: `${definition.name} cancelled booking ${reference}.`,
        providerId,
        providerName: definition.name,
        source: "mock",
        success: true,
      };
    },
    async updateBooking(input: CalendarMutationInput): Promise<CalendarMutationResult> {
      const reference = buildMockBookingReference(providerId, input.appointment.confirmation_reference || input.appointment.id);
      return {
        externalBookingId: reference,
        message: `${definition.name} updated booking ${reference}.`,
        providerId,
        providerName: definition.name,
        source: "mock",
        success: true,
      };
    },
  };
}

export async function getCalendarProviderAdapterForClinic(clinicId: string) {
  const selection = await resolveClinicCalendarSelection(clinicId);
  return createMockCalendarProvider(selection.providerId);
}

export async function getCalendarAvailabilityForClinic(input: CalendarAvailabilityInput & { clinicId: string }) {
  const provider = await getCalendarProviderAdapterForClinic(input.clinicId);
  const result = await provider.getAvailability(input);
  return result;
}

export async function syncCalendarBookingCreation(input: CalendarBookingSyncInput) {
  const provider = await getCalendarProviderAdapterForClinic(input.clinicId);
  try {
    return await provider.createBooking(input);
  } catch (error) {
    logTwilioDbWriteFailure("calendar_provider_booking_failed", error, {
      clinicId: input.clinicId,
      operation: "create",
      provider: provider.name,
      table: "appointments",
    });

    return {
      externalBookingId: null,
      message: `${provider.name} booking sync failed.`,
      providerId: provider.id,
      providerName: provider.name,
      source: "mock",
      success: false,
    } satisfies CalendarMutationResult;
  }
}

export async function syncCalendarBookingUpdate(input: CalendarMutationInput & { clinicId: string }) {
  const provider = await getCalendarProviderAdapterForClinic(input.clinicId);
  try {
    return await provider.updateBooking(input);
  } catch (error) {
    logTwilioDbWriteFailure("calendar_provider_update_failed", error, {
      clinicId: input.clinicId,
      operation: "update",
      provider: provider.name,
      table: "appointments",
    });

    return {
      externalBookingId: null,
      message: `${provider.name} update sync failed.`,
      providerId: provider.id,
      providerName: provider.name,
      source: "mock",
      success: false,
    } satisfies CalendarMutationResult;
  }
}

export async function syncCalendarBookingCancellation(input: CalendarMutationInput & { clinicId: string }) {
  const provider = await getCalendarProviderAdapterForClinic(input.clinicId);
  try {
    return await provider.cancelBooking(input);
  } catch (error) {
    logTwilioDbWriteFailure("calendar_provider_cancel_failed", error, {
      clinicId: input.clinicId,
      operation: "cancel",
      provider: provider.name,
      table: "appointments",
    });

    return {
      externalBookingId: null,
      message: `${provider.name} cancellation sync failed.`,
      providerId: provider.id,
      providerName: provider.name,
      source: "mock",
      success: false,
    } satisfies CalendarMutationResult;
  }
}
