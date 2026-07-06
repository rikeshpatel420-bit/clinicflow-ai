import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Appointment } from "@/types/database";
import type { CalendarAvailabilityInput, CalendarAvailabilitySlot, CalendarProviderId } from "./types";

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
    hour: Number(parts.hour ?? "0"),
    minute: Number(parts.minute ?? "0"),
    weekday: parts.weekday ?? "Mon",
  };
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

export async function resolveClinicTimeZone(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("clinics").select("timezone").eq("id", clinicId).maybeSingle<{ timezone: string | null }>();

  if (error || !data?.timezone) {
    return "Europe/London";
  }

  return data.timezone;
}

export async function loadConfirmedAppointments(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("appointment_end, appointment_start")
    .eq("clinic_id", clinicId)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .order("appointment_start", { ascending: true })
    .returns<Array<Pick<Appointment, "appointment_end" | "appointment_start">>>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function findSharedNextAvailableAppointmentSlot(input: CalendarAvailabilityInput & { providerId: CalendarProviderId }) {
  const timezone = input.timezone ?? (await resolveClinicTimeZone(input.clinicId));
  const confirmedAppointments = await loadConfirmedAppointments(input.clinicId);
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
      available: true,
      endAt: candidateEnd.toISOString(),
      label: appointmentLabel(candidate, timezone),
      notes: input.emergency ? ["Emergency slot selected first."] : ["Mocked provider availability matched the clinic diary."],
      providerId: input.providerId,
      source: "shared" as const,
      startAt: candidate.toISOString(),
    } satisfies CalendarAvailabilitySlot;
  }

  return null;
}
