export type CommunicationChannel = "sms" | "email" | "whatsapp" | "phone" | "internal_note";

export type CommunicationProvider = {
  channel: CommunicationChannel;
  provider: string;
  enabled: boolean;
  testMode: boolean;
};

export const communicationProviders: CommunicationProvider[] = [
  { channel: "sms", provider: "Twilio placeholder", enabled: false, testMode: true },
  { channel: "email", provider: "Transactional email placeholder", enabled: false, testMode: true },
  { channel: "whatsapp", provider: "WhatsApp Business placeholder", enabled: false, testMode: true },
  { channel: "phone", provider: "Call event placeholder", enabled: false, testMode: true },
  { channel: "internal_note", provider: "ClinicFlow internal", enabled: true, testMode: true },
];

