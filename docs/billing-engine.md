# Billing Engine

Flow OS uses a Stripe-ready billing abstraction instead of hard-wiring payments into product logic.

## Model

- plans
- trials
- subscriptions
- seats
- usage limits
- invoices
- entitlements
- billing status

## Why this matters

This keeps billing separate from product behaviour. A product can be activated, trialed, or limited without changing the shared platform code.

## Current implementation

- Plan catalog is defined in `src/lib/billing/plans.ts`
- Quotas live in `src/lib/billing/quotas.ts`
- Demo billing state lives in `src/lib/billing/data.ts`
- Entitlements are exposed through the billing pages and the commercial control plane

## Stripe readiness

The UI is wired to show whether Stripe environment variables are configured, but the live payment flow can be added later without redesigning the platform model.
