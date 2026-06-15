import type { UsageMeter } from "@/lib/billing/types";

export function usagePercentage(meter: UsageMeter) {
  if (meter.limit === 0) return 0;
  return Math.min(100, Math.round((meter.used / meter.limit) * 100));
}

export function isQuotaExceeded(meter: UsageMeter) {
  return meter.used > meter.limit;
}

export const accountQuotas = {
  starter: { clinics: 1, seats: 3, conversations: 500, automations: 5 },
  growth: { clinics: 3, seats: 15, conversations: 5000, automations: 30 },
  enterprise: { clinics: 999, seats: 999, conversations: 100000, automations: 500 },
};

