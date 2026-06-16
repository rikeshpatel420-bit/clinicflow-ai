# Database Schema

ClinicFlow AI uses a multi-tenant Supabase Postgres schema. `clinics` is the tenant root and production tables are scoped by `clinic_id` wherever they contain clinic data.

## Migration Files

- `supabase/migrations/0001_multi_tenant_foundation.sql`: tenant, patient, call, conversation, campaign, and recovery foundations.
- `supabase/migrations/0002_production_saas_backend.sql`: production SaaS hardening, RLS policies, leads, SMS events, AI audit logs, metrics, billing, provider webhooks, and UK GDPR support.
- `supabase/seed.sql`: intentionally empty for production.

## Tenant And Auth

- `clinics`: clinic organisation workspace, UK/EU data region, retention defaults, legal identifiers.
- `profiles`: application profile for each Supabase Auth user inside a clinic.
- `clinic_members`: staff membership, status, and role mapping.

RLS helper functions:

- `current_user_clinic_ids()`
- `is_clinic_member(target_clinic_id)`
- `has_clinic_role(target_clinic_id, allowed_roles)`

## Patient And Lead Data

- `patients`: patient CRM records with lawful basis, consent flags, retention date, and soft-delete support.
- `patient_leads`: conversion pipeline for enquiries, missed calls, campaign replies, referrals, and manual leads.
- `consent_records`: append-only channel consent history.
- `data_subject_requests`: access, erasure, rectification, restriction, portability, and objection workflows.

## Communications

- `calls`: provider-neutral call records.
- `missed_call_recovery_workflows`: operational state machine for missed-call recovery.
- `conversations`: patient conversation threads.
- `conversation_messages`: thread timeline messages.
- `communication_provider_accounts`: Twilio/email/WhatsApp provider connection metadata.
- `sms_events`: inbound/outbound SMS delivery and status ledger.
- `webhook_events`: idempotent provider webhook processing ledger.

## AI Audit

- `ai_conversation_audit_logs`: draft, approval, rejection, sending, summary, and classification audit trail. The schema supports hashes and metadata so sensitive prompt/output retention can be controlled deliberately.

## Metrics And Dashboard

- `dashboard_metric_snapshots`: materialised KPI snapshots for low-cost dashboard reads.
- `recovery_opportunities`: revenue recovery pipeline for missed calls and lost leads.

## Billing

- `billing_customers`: Stripe-ready customer mapping.
- `subscription_records`: subscription state machine.
- `usage_meter_events`: append-only usage metering.
- `invoice_records`: invoice metadata and payment status.

## Audit

- `audit_events`: internal audit-safe event history for financial, access, patient, and operational activity.

## Access Model

- Owners/admins manage clinic, team, billing, provider accounts, data subject requests, and audit visibility.
- Managers manage leads, campaigns, recovery, and analytics workflows.
- Receptionists manage patient communications and missed-call recovery.
- Clinicians can access patient and conversation context.
- Members have read-oriented access.

## Type Generation

After applying migrations, regenerate Supabase types:

```bash
supabase gen types typescript --project-id <project-ref> --schema public > src/types/database.ts
```
