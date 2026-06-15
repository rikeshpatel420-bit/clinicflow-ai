# ClinicFlow AI Platform Architecture

This document records the production-readiness direction for the local demo build.

## Shared Foundations

- Central app config lives in `src/config/app.ts`.
- Protected route and dashboard navigation config lives in `src/config/navigation.ts`.
- Shared UI primitives live in `src/components/ui`.
- Shared layout primitives live in `src/components/layout`.
- Shared formatting and async state helpers live in `src/lib/utils`.

## Integration Safety

Stripe, Twilio, and OpenAI remain disabled placeholders until real credentials and approval flows are added.

## Multi-Tenant Direction

Tenant-aware data should pass through explicit tenant context helpers before reading or mutating clinic-scoped records.

