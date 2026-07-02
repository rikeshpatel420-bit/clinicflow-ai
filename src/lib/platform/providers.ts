export type ProviderCapability = "auth" | "communications" | "calendar" | "crm" | "practice_management" | "billing" | "automation" | "webhooks";

export type ProviderAdapter = {
  id: string;
  name: string;
  capability: ProviderCapability;
  enabled: boolean;
  safeMode: boolean;
};

export const providerAdapters: ProviderAdapter[] = [
  { id: "supabase", name: "Supabase", capability: "auth", enabled: true, safeMode: true },
  { id: "twilio", name: "Twilio", capability: "communications", enabled: false, safeMode: true },
  { id: "google-calendar", name: "Google Calendar", capability: "calendar", enabled: false, safeMode: true },
  { id: "microsoft-365", name: "Microsoft 365", capability: "calendar", enabled: false, safeMode: true },
  { id: "email", name: "Email", capability: "communications", enabled: false, safeMode: true },
  { id: "whatsapp", name: "WhatsApp", capability: "communications", enabled: false, safeMode: true },
  { id: "hubspot", name: "HubSpot", capability: "crm", enabled: false, safeMode: true },
  { id: "stripe", name: "Stripe", capability: "billing", enabled: false, safeMode: true },
  { id: "webhooks", name: "Webhooks", capability: "webhooks", enabled: false, safeMode: true },
  { id: "zapier", name: "Zapier", capability: "automation", enabled: false, safeMode: true },
  { id: "make", name: "Make", capability: "automation", enabled: false, safeMode: true },
  { id: "n8n", name: "n8n", capability: "automation", enabled: false, safeMode: true },
];

