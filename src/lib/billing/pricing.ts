import type { BillingCycle } from "@/lib/billing/types";

export function calculateSeatPrice(basePricePence: number, seats: number) {
  return basePricePence + Math.max(0, seats - 1) * 2900;
}

export function applyBillingCycle(pricePence: number, cycle: BillingCycle) {
  return cycle === "annual" ? Math.round(pricePence * 12 * 0.84) : pricePence;
}

export function formatBillingCurrency(pence: number) {
  return new Intl.NumberFormat("en-GB", { currency: "GBP", style: "currency" }).format(pence / 100);
}

