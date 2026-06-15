export type SmsRecoveryDraft = {
  body: string;
  to: string | null;
};

export function createRecoverySmsDraft(input: { clinicName?: string | null; patientPhone?: string | null }): SmsRecoveryDraft {
  return {
    body: `Hi, this is ${input.clinicName ?? "the clinic"}. Sorry we missed your call. Reply here and our team will help you shortly.`,
    to: input.patientPhone ?? null,
  };
}

export async function queueRecoverySmsPlaceholder(draft: SmsRecoveryDraft) {
  return {
    draft,
    mode: "test",
    sent: false,
    message: "SMS sending is disabled until Twilio credentials and live workflow approval are added.",
  };
}
