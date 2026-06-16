# Production Backend

ClinicFlow AI uses Supabase Auth, Postgres, Row Level Security, and Vercel-compatible server routes. The backend is intentionally provider-neutral: Stripe, Twilio, and OpenAI records can be stored safely before live integrations are enabled.

## Core Architecture

- `clinics` is the tenant root.
- `clinic_members` maps Supabase Auth users to clinic organisations and roles.
- RLS policies scope clinic data through `is_clinic_member()` and `has_clinic_role()`.
- Webhooks and scheduled jobs should use the server-only Supabase service role client.
- The database seed is empty. Real production data is created through auth, onboarding, webhooks, and audited server actions.

## Production Tables

- Organisations and access: `clinics`, `profiles`, `clinic_members`
- Patient CRM and leads: `patients`, `patient_leads`
- Missed-call recovery: `calls`, `missed_call_recovery_workflows`, `recovery_opportunities`
- Communications: `conversations`, `conversation_messages`, `communication_provider_accounts`, `sms_events`
- AI safety: `ai_conversation_audit_logs`
- Metrics: `dashboard_metric_snapshots`
- Billing: `billing_customers`, `subscription_records`, `usage_meter_events`, `invoice_records`
- Provider ingestion: `webhook_events`
- UK GDPR support: `consent_records`, `data_subject_requests`, retention fields on patient records
- Internal audit: `audit_events`

## Roles

- `owner`: full clinic, billing, team, and security control
- `admin`: operational administration and billing visibility
- `manager`: patient, lead, campaign, workflow, and analytics access
- `receptionist`: patient communication and recovery workflows
- `clinician`: patient records and conversation context
- `member`: read-oriented access

## UK GDPR-Conscious Design

- Patient records store lawful basis, consent flags, consent timestamps, and retention dates.
- Consent changes are append-only in `consent_records`.
- Data subject requests are tracked with a default 30-day due date.
- AI audit logs store hashes and metadata rather than requiring full prompt/output storage.
- SMS logs store `body_preview`; full-message retention should be controlled by clinic policy.
- Every production table is clinic-scoped or explicitly admin-only.

## Provider Readiness

Twilio-ready:

- Store provider account metadata in `communication_provider_accounts`.
- Store inbound/outbound delivery activity in `sms_events`.
- Store raw webhook processing state in `webhook_events`.

Stripe-ready:

- Store customer mapping in `billing_customers`.
- Store subscription lifecycle in `subscription_records`.
- Store usage in `usage_meter_events`.
- Store invoice metadata in `invoice_records`.

OpenAI-ready:

- Store draft, approval, summary, and classification audit entries in `ai_conversation_audit_logs`.
- Require human approval before sending AI-generated patient communication.

## Migrations

Run migrations with the Supabase CLI:

```bash
supabase db push
```

Generate fresh TypeScript database types after applying migrations:

```bash
supabase gen types typescript --project-id <project-ref> --schema public > src/types/database.ts
```

## Environment Variables

Required for production:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by browser and server clients.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used with RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key for trusted webhooks, scheduled jobs, and admin maintenance.
- `NEXT_PUBLIC_SITE_URL`: Public app URL for auth redirects.
- `CRON_SECRET`: Shared secret for Vercel cron or internal scheduled endpoints.

Required when Twilio goes live:

- `TWILIO_ACCOUNT_SID`: Twilio account identifier.
- `TWILIO_AUTH_TOKEN`: Twilio API secret, server-only.
- `TWILIO_MESSAGING_SERVICE_SID`: Messaging service for outbound SMS.
- `TWILIO_PHONE_NUMBER`: Fallback sending number.
- `TWILIO_WEBHOOK_SIGNING_SECRET`: Secret used to verify inbound webhook signatures.
- `TWILIO_WEBHOOK_TEST_MODE`: Keeps webhook handlers in non-sending mode when `true`.

Required when Stripe goes live:

- `STRIPE_PUBLISHABLE_KEY`: Browser-safe Stripe publishable key.
- `STRIPE_SECRET_KEY`: Server-only Stripe API key.
- `STRIPE_WEBHOOK_SECRET`: Secret for verifying Stripe webhook signatures.
- `STRIPE_PRICE_STARTER`: Stripe Price ID for Starter.
- `STRIPE_PRICE_GROWTH`: Stripe Price ID for Growth.
- `STRIPE_PRICE_ENTERPRISE`: Stripe Price ID for Enterprise.

Required when AI drafting goes live:

- `OPENAI_API_KEY`: Server-only API key for AI drafting and classification.

Deployment metadata:

- `VERCEL_ENV`: Vercel-provided environment name.
