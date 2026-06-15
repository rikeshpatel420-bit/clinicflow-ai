# Database Schema

ClinicFlow AI uses a multi-tenant Supabase Postgres schema. The tenant root is `clinics`; clinic-owned data links back through `clinic_id`.

## Tables

### clinics

Tenant workspace for each clinic.

Key columns:

- `id`
- `name`
- `slug`
- `status`
- `timezone`
- `phone`
- `created_by`
- `created_at`
- `updated_at`
- `deleted_at`

### profiles

Clinic-scoped application profile for each Supabase Auth user.

Key columns:

- `id`
- `clinic_id`
- `user_id`
- `full_name`
- `email`
- `avatar_url`
- `onboarding_completed_at`
- `created_at`
- `updated_at`

### clinic_members

Join table connecting users to clinic workspaces.

Key columns:

- `id`
- `clinic_id`
- `user_id`
- `role`
- `status`
- `invited_email`
- `invited_by`
- `joined_at`
- `created_at`
- `updated_at`

Supported roles:

- `owner`
- `admin`
- `manager`
- `receptionist`
- `clinician`
- `member`

### patients

Clinic-scoped patient CRM foundation.

Key columns:

- `id`
- `clinic_id`
- `full_name`
- `preferred_name`
- `email`
- `phone`
- `date_of_birth`
- `status`
- `source`
- `notes`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

### calls

Clinic-scoped call log foundation. This is provider-neutral until Twilio is added.

Key columns:

- `id`
- `clinic_id`
- `patient_id`
- `direction`
- `status`
- `caller_number`
- `clinic_number`
- `started_at`
- `ended_at`
- `duration_seconds`
- `summary`
- `recovery_status`
- `recovery_next_action`
- `recovery_updated_at`
- `created_at`
- `updated_at`
- `deleted_at`

## Audit Timestamps

Every table includes:

- `created_at`
- `updated_at`

Soft-delete-ready tables also include:

- `deleted_at`

The migration creates a `set_updated_at()` trigger function and applies it to all foundation tables.

## Row Level Security Preparation

RLS is enabled on:

- `clinics`
- `profiles`
- `clinic_members`
- `patients`
- `calls`

Policies should be added after the app has real auth actions and tested membership rules.

## Local Files

- Migration: `supabase/migrations/0001_multi_tenant_foundation.sql`
- Seed structure: `supabase/seed.sql`
- TypeScript types: `src/types/database.ts`

## Onboarding Data Flow

The onboarding form creates:

1. A `clinics` row for the tenant workspace.
2. A clinic-scoped `profiles` row for the authenticated owner.
3. A `clinic_members` row with `role = 'owner'` and `status = 'active'`.

This pattern keeps the dashboard clinic-scoped from the first real record.

## Dashboard Data Flow

The dashboard loader:

1. Reads the current authenticated user.
2. Finds the first active `clinic_members` row.
3. Loads the matching `clinics` row.
4. Loads the matching clinic-scoped `profiles` row.
5. Loads recent `patients` for that `clinic_id`.

Dashboard preview call rows may still be derived from phone-sourced patients. The dedicated `/calls` module reads from the provider-neutral `calls` table.

When Supabase environment variables are missing, the dashboard uses demo fallback data so local UI development still works.

## Calls Data Flow

The `/calls` route uses a provider-neutral call log pattern:

1. Read the authenticated user.
2. Resolve the first active `clinic_members` row.
3. Load the tenant `clinics` row.
4. Query `calls` with the resolved `clinic_id`.
5. Render status badges for missed, answered, recovered, voicemail, and queued calls.

The call detail route is a placeholder for future transcripts, recovery activity, notes, and Twilio metadata.

When Supabase environment variables are missing, `/calls` uses demo fallback call data.

## Missed-Call Recovery State

The `calls` table now includes a safe recovery workflow state model:

- `not_started`
- `queued`
- `sms_draft`
- `awaiting_reply`
- `recovered`
- `closed`
- `failed`

The Twilio webhook placeholders can detect missed-call statuses and generate a recovery state, but they do not send SMS or persist live webhook data yet.

## Revenue Recovery Pipeline

The `recovery_opportunities` table tracks measurable recovery from missed calls and lost leads.

Pipeline stages:

- `missed`
- `contacted`
- `replied`
- `booked`
- `lost`

Key fields:

- `clinic_id`
- `call_id`
- `patient_id`
- `stage`
- `priority_score`
- `estimated_revenue_pence`
- `booked_at`
- `lost_reason`
- `next_action`

The `/recovery` page uses this model to calculate recovered revenue, conversion rate, booked leads, and high-priority recovery opportunities.

## Patient CRM Data Flow

The `/patients` route follows the same clinic-scoped access pattern:

1. Read the authenticated user.
2. Resolve the first active `clinic_members` row.
3. Load the tenant `clinics` row.
4. Query `patients` with the resolved `clinic_id`.
5. Apply search and status filters within that clinic view.

The patient CRM currently includes:

- patient list page
- search and status filter UI
- patient detail placeholder route
- add-patient placeholder route
- demo fallback patients when Supabase env vars are missing
- loading, error, and empty states

Patient creation is intentionally still a placeholder. Real insert actions should be added after auth forms and RLS policies are fully tested.
