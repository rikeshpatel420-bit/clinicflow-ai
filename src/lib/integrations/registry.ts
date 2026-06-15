import type { ProviderDefinition } from "@/lib/integrations/types";

export const providerRegistry: ProviderDefinition[] = [
  {
    key: "dentally",
    name: "Dentally",
    category: "practice_management",
    description: "Practice management connector placeholder for patients, appointments, recalls, and treatment activity.",
    supportedObjects: ["patients", "appointments", "recalls", "clinicians"],
  },
  {
    key: "soe",
    name: "Software of Excellence",
    category: "practice_management",
    description: "SOE connector placeholder for enterprise dental practice data sync.",
    supportedObjects: ["patients", "appointments", "transactions", "providers"],
  },
  {
    key: "exact",
    name: "EXACT",
    category: "practice_management",
    description: "EXACT connector placeholder for appointment books and patient records.",
    supportedObjects: ["patients", "appointments", "treatment_plans"],
  },
  {
    key: "hubspot",
    name: "HubSpot",
    category: "crm",
    description: "CRM connector placeholder for lead source, lifecycle stage, and sales attribution.",
    supportedObjects: ["contacts", "deals", "activities"],
  },
  {
    key: "twilio",
    name: "Twilio",
    category: "communications",
    description: "Communications connector placeholder for calls, SMS, delivery statuses, and recordings.",
    supportedObjects: ["calls", "messages", "webhook_events"],
  },
  {
    key: "google_calendar",
    name: "Google Calendar",
    category: "calendar",
    description: "Calendar connector placeholder for availability checks and appointment visibility.",
    supportedObjects: ["calendars", "events", "availability"],
  },
];

export function getProviderName(key: ProviderDefinition["key"]) {
  return providerRegistry.find((provider) => provider.key === key)?.name ?? key;
}

