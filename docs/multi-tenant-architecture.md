# Multi-Tenant Architecture

ClinicFlow AI is structured as a clinic-scoped SaaS application.

## Tenant Model

The main tenant is a clinic workspace:

```txt
clinics
  clinic_members
  patients
```

Users are Supabase Auth identities with clinic-scoped application profiles. A user can belong to one or more clinics through `clinic_members`.

## Access Pattern

The app should resolve the active clinic from:

1. The authenticated user.
2. Their `clinic_members` rows.
3. Their selected clinic-scoped `profiles` row.

Dashboard queries should always filter by `clinic_id`.

## RLS Direction

The intended RLS rule is:

```txt
A user can read or write clinic data only when an active clinic_members row exists for that user and clinic.
```

Example policy shape:

```sql
exists (
  select 1
  from public.clinic_members cm
  where cm.clinic_id = patients.clinic_id
    and cm.user_id = auth.uid()
    and cm.status = 'active'
)
```

Policies are not fully activated yet because the auth action flow still needs to be wired and tested.

## Scalable SaaS Notes

- `clinics` is the tenant boundary.
- `clinic_members` stores roles and membership status.
- `patients` is clinic-scoped from day one.
- Future modules should include `clinic_id` by default.
- Dashboard pages should query clinic-specific records only.
- Admin-only platform views should be separate from clinic workspace routes.

## Future Tables

Add these later when their implementation phases begin:

- `appointments`
- `calls`
- `call_transcripts`
- `sms_messages`
- `tasks`
- `subscriptions`
- `usage_events`
- `audit_logs`
- `integration_settings`

No Twilio, Stripe, or AI workflow tables are included in this phase.
