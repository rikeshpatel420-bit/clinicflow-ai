export const appConfig = {
  defaultLocale: "en-GB",
  demoMode: true,
  name: "ClinicFlow AI",
  productionUrl: "https://www.clinicflowhq.co.uk",
  shortName: "CF",
  supportEmail: "support@clinicflow.example",
};

export const integrationSafetyConfig = {
  openai: "disabled-demo-only",
  stripe: "disabled-demo-only",
  twilio: "disabled-test-mode",
} as const;

