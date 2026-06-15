export type ProviderCapability = "auth" | "communications" | "calendar" | "crm" | "practice_management" | "billing";

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
  { id: "hubspot", name: "HubSpot", capability: "crm", enabled: false, safeMode: true },
  { id: "stripe", name: "Stripe", capability: "billing", enabled: false, safeMode: true },
];

