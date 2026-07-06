import type { CalendarProviderId, CalendarProviderKind } from "./types";

export type CalendarProviderDefinition = {
  description: string;
  id: CalendarProviderId;
  kind: CalendarProviderKind;
  name: string;
  supportedOperations: Array<"availability" | "booking" | "cancellation" | "updates">;
  supportsMockImplementation: boolean;
};

export const calendarProviderRegistry: CalendarProviderDefinition[] = [
  {
    description: "Practice management adapter for clinic diary availability, appointment creation, updates, and cancellations.",
    id: "dentally",
    kind: "practice_management",
    name: "Dentally",
    supportedOperations: ["availability", "booking", "cancellation", "updates"],
    supportsMockImplementation: true,
  },
  {
    description: "Practice management adapter for diary synchronisation and confirmed booking workflows.",
    id: "soe",
    kind: "practice_management",
    name: "Software of Excellence",
    supportedOperations: ["availability", "booking", "cancellation", "updates"],
    supportsMockImplementation: true,
  },
  {
    description: "Practice management adapter for appointment books and patient-facing booking journeys.",
    id: "exact",
    kind: "practice_management",
    name: "Exact",
    supportedOperations: ["availability", "booking", "cancellation", "updates"],
    supportsMockImplementation: true,
  },
  {
    description: "Calendar adapter for Google Calendar availability, booking, rescheduling, and cancellation flows.",
    id: "google_calendar",
    kind: "calendar",
    name: "Google Calendar",
    supportedOperations: ["availability", "booking", "cancellation", "updates"],
    supportsMockImplementation: true,
  },
  {
    description: "Outlook calendar adapter for Microsoft 365 scheduling and appointment visibility.",
    id: "microsoft_outlook",
    kind: "calendar",
    name: "Microsoft Outlook",
    supportedOperations: ["availability", "booking", "cancellation", "updates"],
    supportsMockImplementation: true,
  },
];

const providerLookup = new Map(calendarProviderRegistry.map((provider) => [provider.id, provider]));

const nameLookup: Record<string, CalendarProviderId> = {
  dentally: "dentally",
  exact: "exact",
  google_calendar: "google_calendar",
  googlecalendar: "google_calendar",
  "google calendar": "google_calendar",
  microsoft_365: "microsoft_outlook",
  "microsoft 365": "microsoft_outlook",
  microsoftoutlook: "microsoft_outlook",
  "microsoft outlook": "microsoft_outlook",
  soe: "soe",
  "software of excellence": "soe",
};

export function listCalendarProviders() {
  return [...calendarProviderRegistry];
}

export function getCalendarProviderDefinition(providerId: CalendarProviderId) {
  return providerLookup.get(providerId) ?? providerLookup.get("google_calendar")!;
}

export function getCalendarProviderName(providerId: CalendarProviderId) {
  return getCalendarProviderDefinition(providerId).name;
}

export function resolveCalendarProviderId(value?: string | null): CalendarProviderId {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
  return nameLookup[normalized] ?? nameLookup[normalized.replace(/[_-]/g, " ")] ?? "google_calendar";
}

