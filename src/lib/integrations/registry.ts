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
  {
    key: "microsoft_outlook",
    name: "Microsoft Outlook",
    category: "calendar",
    description: "Microsoft Outlook calendar adapter for calendars, mailboxes, and staff scheduling.",
    supportedObjects: ["calendars", "mailboxes", "availability"],
  },
  {
    key: "email",
    name: "Email",
    category: "communications",
    description: "Generic email transport placeholder for confirmations, reminders, and follow-ups.",
    supportedObjects: ["messages", "templates", "delivery_status"],
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    category: "communications",
    description: "WhatsApp interface placeholder for future conversational follow-up delivery.",
    supportedObjects: ["messages", "templates", "delivery_status"],
  },
  {
    key: "stripe",
    name: "Stripe",
    category: "billing",
    description: "Billing and subscription placeholder for plans, invoices, payments, and entitlements.",
    supportedObjects: ["plans", "subscriptions", "invoices", "usage"],
  },
  {
    key: "webhooks",
    name: "Webhooks",
    category: "webhooks",
    description: "Webhook delivery placeholder for inbound events and downstream automation triggers.",
    supportedObjects: ["events", "deliveries", "retries"],
  },
  {
    key: "zapier",
    name: "Zapier",
    category: "automation",
    description: "Zapier connector placeholder for no-code automations and external workflow handoffs.",
    supportedObjects: ["triggers", "actions", "tasks"],
  },
  {
    key: "make",
    name: "Make",
    category: "automation",
    description: "Make connector placeholder for visual automation scenarios and routed actions.",
    supportedObjects: ["scenarios", "routers", "webhooks"],
  },
  {
    key: "n8n",
    name: "n8n",
    category: "automation",
    description: "n8n connector placeholder for self-hosted automation flows and low-code orchestration.",
    supportedObjects: ["workflows", "triggers", "webhooks"],
  },
];

export function getProviderName(key: ProviderDefinition["key"]) {
  return providerRegistry.find((provider) => provider.key === key)?.name ?? key;
}

