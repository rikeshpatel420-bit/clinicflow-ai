-- ClinicFlow AI production Supabase schema.
-- Safe to run more than once: uses IF NOT EXISTS, additive ALTER TABLE, and policy replacement.
-- No fake data or seed records are inserted.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_clinic_member(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_users
    where clinic_id = target_clinic_id
      and auth_user_id = auth.uid()
      and status = 'active'
  )
$$;

create or replace function public.has_clinic_role(target_clinic_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_users
    where clinic_id = target_clinic_id
      and auth_user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  )
$$;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  company_number text,
  ico_registration_number text,
  phone text,
  timezone text not null default 'Europe/London',
  country_code text not null default 'GB',
  data_region text not null default 'uk' check (data_region in ('uk', 'eu')),
  default_retention_months integer not null default 84 check (default_retention_months between 12 and 120),
  status text not null default 'active' check (status in ('active', 'paused', 'suspended', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'receptionist', 'clinician', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_email text,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, auth_user_id)
);

create table if not exists public.patient_leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'website', 'phone', 'missed_call', 'referral', 'campaign', 'import')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'booked', 'won', 'lost', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  estimated_value_pence integer not null default 0 check (estimated_value_pence >= 0),
  enquiry_summary text,
  next_follow_up_at timestamptz,
  converted_at timestamptz,
  loss_reason text,
  gdpr_lawful_basis text not null default 'legitimate_interest' check (
    gdpr_lawful_basis in ('consent', 'contract', 'legal_obligation', 'vital_interest', 'public_task', 'legitimate_interest')
  ),
  marketing_consent boolean not null default false,
  retention_until date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lead_id uuid references public.patient_leads(id) on delete set null,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  status text not null default 'missed' check (status in ('missed', 'answered', 'recovered', 'voicemail', 'queued', 'failed')),
  caller_number_hash text,
  caller_number_last4 text,
  clinic_number text,
  provider text not null default 'manual' check (provider in ('manual', 'twilio')),
  provider_call_id text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  recovery_status text not null default 'not_started' check (
    recovery_status in ('not_started', 'queued', 'drafted', 'awaiting_reply', 'recovered', 'closed', 'failed')
  ),
  recovery_next_action text,
  recovery_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.recovery_workflows (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  lead_id uuid references public.patient_leads(id) on delete set null,
  state text not null default 'queued' check (
    state in ('queued', 'drafted', 'awaiting_staff_approval', 'message_queued', 'awaiting_patient_reply', 'booked', 'closed', 'failed')
  ),
  channel text not null default 'sms' check (channel in ('sms', 'phone', 'email', 'whatsapp')),
  current_step integer not null default 1 check (current_step > 0),
  max_steps integer not null default 3 check (max_steps > 0),
  assigned_user_id uuid references auth.users(id) on delete set null,
  next_action_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.sms_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lead_id uuid references public.patient_leads(id) on delete set null,
  call_id uuid references public.calls(id) on delete set null,
  recovery_workflow_id uuid references public.recovery_workflows(id) on delete set null,
  provider text not null default 'twilio' check (provider in ('twilio', 'manual')),
  provider_message_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'delivered', 'undelivered', 'failed', 'received', 'cancelled')
  ),
  from_number_hash text,
  to_number_hash text,
  to_number_last4 text,
  body_preview text,
  error_code text,
  error_message text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lead_id uuid references public.patient_leads(id) on delete set null,
  call_id uuid references public.calls(id) on delete set null,
  recovery_workflow_id uuid references public.recovery_workflows(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (
    action in ('draft_created', 'draft_edited', 'draft_approved', 'draft_rejected', 'message_sent', 'summary_created', 'classification_created')
  ),
  model_provider text not null default 'none' check (model_provider in ('none', 'openai', 'manual')),
  model_name text,
  prompt_version text,
  input_hash text,
  output_hash text,
  safety_status text not null default 'not_required' check (safety_status in ('not_required', 'passed', 'needs_review', 'blocked')),
  human_approved boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.dashboard_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  missed_calls integer not null default 0 check (missed_calls >= 0),
  recovered_calls integer not null default 0 check (recovered_calls >= 0),
  new_leads integer not null default 0 check (new_leads >= 0),
  booked_leads integer not null default 0 check (booked_leads >= 0),
  sms_sent integer not null default 0 check (sms_sent >= 0),
  revenue_recovered_pence integer not null default 0 check (revenue_recovered_pence >= 0),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, period_start, period_end)
);

create table if not exists public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  stripe_customer_id text unique,
  billing_email text,
  billing_owner_type text not null default 'clinic' check (billing_owner_type in ('clinic', 'agency', 'enterprise')),
  tax_country text not null default 'GB',
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  stripe_customer_id uuid references public.stripe_customers(id) on delete set null,
  plan_key text not null check (plan_key in ('starter', 'growth', 'enterprise')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'incomplete')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  seat_limit integer not null default 3 check (seat_limit > 0),
  stripe_subscription_id text unique,
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinics_slug_idx on public.clinics (slug);
create index if not exists clinics_status_idx on public.clinics (status) where deleted_at is null;
create index if not exists users_auth_user_id_idx on public.users (auth_user_id);
create index if not exists clinic_users_clinic_id_idx on public.clinic_users (clinic_id);
create index if not exists clinic_users_auth_user_id_idx on public.clinic_users (auth_user_id);
create index if not exists clinic_users_role_idx on public.clinic_users (clinic_id, role, status);
create index if not exists patient_leads_clinic_status_idx on public.patient_leads (clinic_id, status) where deleted_at is null;
create index if not exists patient_leads_owner_idx on public.patient_leads (clinic_id, owner_user_id) where deleted_at is null;
create index if not exists patient_leads_follow_up_idx on public.patient_leads (clinic_id, next_follow_up_at) where deleted_at is null;
create index if not exists calls_clinic_started_idx on public.calls (clinic_id, started_at desc) where deleted_at is null;
create index if not exists calls_clinic_status_idx on public.calls (clinic_id, status) where deleted_at is null;
create index if not exists calls_provider_call_idx on public.calls (provider, provider_call_id);
create index if not exists recovery_workflows_clinic_state_idx on public.recovery_workflows (clinic_id, state) where deleted_at is null;
create index if not exists recovery_workflows_next_action_idx on public.recovery_workflows (clinic_id, next_action_at) where deleted_at is null;
create index if not exists sms_events_clinic_occurred_idx on public.sms_events (clinic_id, occurred_at desc);
create index if not exists sms_events_provider_message_idx on public.sms_events (provider, provider_message_id);
create index if not exists ai_audit_logs_clinic_created_idx on public.ai_audit_logs (clinic_id, created_at desc);
create index if not exists metric_snapshots_clinic_period_idx on public.dashboard_metric_snapshots (clinic_id, period_start desc, period_end desc);
create index if not exists stripe_customers_clinic_idx on public.stripe_customers (clinic_id);
create index if not exists subscriptions_clinic_status_idx on public.subscriptions (clinic_id, status);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_clinics_updated_at') then
    create trigger set_clinics_updated_at before update on public.clinics for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_users_updated_at') then
    create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_clinic_users_updated_at') then
    create trigger set_clinic_users_updated_at before update on public.clinic_users for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_patient_leads_updated_at') then
    create trigger set_patient_leads_updated_at before update on public.patient_leads for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_calls_updated_at') then
    create trigger set_calls_updated_at before update on public.calls for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_recovery_workflows_updated_at') then
    create trigger set_recovery_workflows_updated_at before update on public.recovery_workflows for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_dashboard_metric_snapshots_updated_at') then
    create trigger set_dashboard_metric_snapshots_updated_at before update on public.dashboard_metric_snapshots for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_stripe_customers_updated_at') then
    create trigger set_stripe_customers_updated_at before update on public.stripe_customers for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_subscriptions_updated_at') then
    create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.clinics enable row level security;
alter table public.users enable row level security;
alter table public.clinic_users enable row level security;
alter table public.patient_leads enable row level security;
alter table public.calls enable row level security;
alter table public.recovery_workflows enable row level security;
alter table public.sms_events enable row level security;
alter table public.ai_audit_logs enable row level security;
alter table public.dashboard_metric_snapshots enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "authenticated users can create clinics" on public.clinics;
create policy "authenticated users can create clinics" on public.clinics
for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "clinic members can read clinics" on public.clinics;
create policy "clinic members can read clinics" on public.clinics
for select to authenticated
using (public.is_clinic_member(id));

drop policy if exists "owners and admins can update clinics" on public.clinics;
create policy "owners and admins can update clinics" on public.clinics
for update to authenticated
using (public.has_clinic_role(id, array['owner', 'admin']))
with check (public.has_clinic_role(id, array['owner', 'admin']));

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile" on public.users
for select to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "users can create own profile" on public.users;
create policy "users can create own profile" on public.users
for insert to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile" on public.users
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "clinic members can read memberships" on public.clinic_users;
create policy "clinic members can read memberships" on public.clinic_users
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "owners and admins can manage memberships" on public.clinic_users;
create policy "owners and admins can manage memberships" on public.clinic_users
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "clinic creators can create owner membership" on public.clinic_users;
create policy "clinic creators can create owner membership" on public.clinic_users
for insert to authenticated
with check (auth_user_id = auth.uid() and role = 'owner' and status = 'active');

drop policy if exists "members can read patient leads" on public.patient_leads;
create policy "members can read patient leads" on public.patient_leads
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage patient leads" on public.patient_leads;
create policy "ops roles can manage patient leads" on public.patient_leads
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']));

drop policy if exists "members can read calls" on public.calls;
create policy "members can read calls" on public.calls
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage calls" on public.calls;
create policy "ops roles can manage calls" on public.calls
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "members can read recovery workflows" on public.recovery_workflows;
create policy "members can read recovery workflows" on public.recovery_workflows
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage recovery workflows" on public.recovery_workflows;
create policy "ops roles can manage recovery workflows" on public.recovery_workflows
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "members can read sms events" on public.sms_events;
create policy "members can read sms events" on public.sms_events
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can insert sms events" on public.sms_events;
create policy "ops roles can insert sms events" on public.sms_events
for insert to authenticated
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "members can read ai audit logs" on public.ai_audit_logs;
create policy "members can read ai audit logs" on public.ai_audit_logs
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can insert ai audit logs" on public.ai_audit_logs;
create policy "ops roles can insert ai audit logs" on public.ai_audit_logs
for insert to authenticated
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']));

drop policy if exists "members can read dashboard metrics" on public.dashboard_metric_snapshots;
create policy "members can read dashboard metrics" on public.dashboard_metric_snapshots
for select to authenticated
using (public.is_clinic_member(clinic_id));

drop policy if exists "owners and admins can read stripe customers" on public.stripe_customers;
create policy "owners and admins can read stripe customers" on public.stripe_customers
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can read subscriptions" on public.subscriptions;
create policy "owners and admins can read subscriptions" on public.subscriptions
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

comment on table public.clinics is 'Tenant root for ClinicFlow clinic workspaces.';
comment on table public.users is 'Application user profile linked to Supabase auth.users. Does not store passwords.';
comment on table public.clinic_users is 'Clinic membership and RBAC mapping for multi-tenant access control.';
comment on table public.patient_leads is 'Clinic-scoped lead pipeline with UK GDPR lawful basis and retention metadata.';
comment on table public.calls is 'Clinic-scoped call records using hashed caller identifiers where possible.';
comment on table public.sms_events is 'SMS delivery ledger with minimal body preview and hashed phone identifiers.';
comment on table public.recovery_workflows is 'Missed-call recovery workflow state machine.';
comment on table public.ai_audit_logs is 'AI action audit trail using hashes and metadata for safe retention.';
comment on table public.dashboard_metric_snapshots is 'Low-cost dashboard KPI snapshots by clinic and period.';
comment on table public.stripe_customers is 'Stripe-ready customer mapping without payment card data.';
comment on table public.subscriptions is 'Stripe-ready subscription state records.';
