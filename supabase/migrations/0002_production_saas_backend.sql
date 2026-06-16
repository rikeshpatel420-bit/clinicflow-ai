create extension if not exists pgcrypto;

create or replace function public.current_user_clinic_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id
  from public.clinic_members
  where user_id = auth.uid()
    and status = 'active'
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
    from public.clinic_members
    where clinic_id = target_clinic_id
      and user_id = auth.uid()
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
    from public.clinic_members
    where clinic_id = target_clinic_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  )
$$;

alter table public.clinics
  add column if not exists legal_name text,
  add column if not exists company_number text,
  add column if not exists ico_registration_number text,
  add column if not exists data_region text not null default 'uk' check (data_region in ('uk', 'eu')),
  add column if not exists default_retention_months integer not null default 84 check (default_retention_months between 12 and 120);

alter table public.profiles
  add column if not exists status text not null default 'active' check (status in ('active', 'disabled')),
  add column if not exists last_seen_at timestamptz;

alter table public.patients
  add column if not exists gdpr_lawful_basis text not null default 'legitimate_interest' check (
    gdpr_lawful_basis in ('consent', 'contract', 'legal_obligation', 'vital_interest', 'public_task', 'legitimate_interest')
  ),
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists sms_consent boolean not null default false,
  add column if not exists email_consent boolean not null default false,
  add column if not exists consent_updated_at timestamptz,
  add column if not exists retention_until date,
  add column if not exists external_reference text;

create table if not exists public.patient_leads (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'website', 'phone', 'missed_call', 'referral', 'campaign', 'import')),
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'booked', 'won', 'lost', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  owner_user_id uuid references auth.users(id) on delete set null,
  estimated_value_pence integer not null default 0 check (estimated_value_pence >= 0),
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  enquiry_summary text,
  loss_reason text,
  next_follow_up_at timestamptz,
  converted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.missed_call_recovery_workflows (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  lead_id uuid references public.patient_leads(id) on delete set null,
  state text not null default 'queued' check (
    state in ('queued', 'drafted', 'awaiting_staff_approval', 'message_queued', 'awaiting_patient_reply', 'booked', 'closed', 'failed')
  ),
  channel text not null default 'sms' check (channel in ('sms', 'phone', 'email', 'whatsapp')),
  current_step integer not null default 1 check (current_step > 0),
  max_steps integer not null default 3 check (max_steps > 0),
  next_action_at timestamptz,
  assigned_user_id uuid references auth.users(id) on delete set null,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.communication_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider text not null check (provider in ('twilio', 'sendgrid', 'mailgun', 'whatsapp_business', 'manual')),
  status text not null default 'not_connected' check (status in ('not_connected', 'pending', 'connected', 'disabled', 'error')),
  external_account_id text,
  sending_number text,
  sending_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, provider, external_account_id)
);

create table if not exists public.sms_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider_account_id uuid references public.communication_provider_accounts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  workflow_id uuid references public.missed_call_recovery_workflows(id) on delete set null,
  provider text not null default 'twilio' check (provider in ('twilio', 'manual')),
  provider_message_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'delivered', 'undelivered', 'failed', 'received', 'cancelled')
  ),
  from_number text,
  to_number text,
  body_preview text,
  error_code text,
  error_message text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_conversation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
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
  unique (clinic_id, period_start, period_end)
);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  billing_owner_type text not null default 'clinic' check (billing_owner_type in ('clinic', 'agency', 'enterprise')),
  billing_email text,
  stripe_customer_id text unique,
  tax_country text not null default 'GB',
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  billing_customer_id uuid references public.billing_customers(id) on delete set null,
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

create table if not exists public.usage_meter_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  subscription_id uuid references public.subscription_records(id) on delete set null,
  meter_key text not null check (meter_key in ('staff_seat', 'sms_outbound', 'ai_draft', 'missed_call_workflow', 'campaign_send')),
  quantity integer not null default 1 check (quantity > 0),
  source text not null default 'app' check (source in ('app', 'webhook', 'system')),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (clinic_id, meter_key, idempotency_key)
);

create table if not exists public.invoice_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  billing_customer_id uuid references public.billing_customers(id) on delete set null,
  stripe_invoice_id text unique,
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  currency text not null default 'gbp',
  amount_due_pence integer not null default 0 check (amount_due_pence >= 0),
  amount_paid_pence integer not null default 0 check (amount_paid_pence >= 0),
  hosted_invoice_url text,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('twilio', 'stripe', 'supabase', 'internal')),
  provider_event_id text,
  clinic_id uuid references public.clinics(id) on delete set null,
  event_type text not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, idempotency_key)
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  channel text not null check (channel in ('sms', 'email', 'phone', 'whatsapp')),
  status text not null check (status in ('granted', 'withdrawn', 'unknown')),
  lawful_basis text not null check (
    lawful_basis in ('consent', 'contract', 'legal_obligation', 'vital_interest', 'public_task', 'legitimate_interest')
  ),
  source text not null default 'manual' check (source in ('manual', 'form', 'import', 'webhook', 'patient_request')),
  captured_by uuid references auth.users(id) on delete set null,
  captured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  request_type text not null check (request_type in ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection')),
  status text not null default 'open' check (status in ('open', 'in_review', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '30 days',
  completed_at timestamptz,
  assigned_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_table text not null,
  entity_id uuid,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists patient_leads_clinic_status_idx on public.patient_leads (clinic_id, status);
create index if not exists patient_leads_owner_idx on public.patient_leads (clinic_id, owner_user_id);
create index if not exists patient_leads_follow_up_idx on public.patient_leads (clinic_id, next_follow_up_at);
create index if not exists missed_call_workflows_clinic_state_idx on public.missed_call_recovery_workflows (clinic_id, state);
create index if not exists missed_call_workflows_next_action_idx on public.missed_call_recovery_workflows (clinic_id, next_action_at);
create index if not exists communication_provider_accounts_clinic_idx on public.communication_provider_accounts (clinic_id, provider);
create index if not exists sms_events_clinic_occurred_idx on public.sms_events (clinic_id, occurred_at desc);
create index if not exists sms_events_provider_message_idx on public.sms_events (provider, provider_message_id);
create index if not exists ai_audit_clinic_created_idx on public.ai_conversation_audit_logs (clinic_id, created_at desc);
create index if not exists metric_snapshots_clinic_period_idx on public.dashboard_metric_snapshots (clinic_id, period_start desc);
create index if not exists subscriptions_clinic_status_idx on public.subscription_records (clinic_id, status);
create index if not exists usage_meter_clinic_meter_idx on public.usage_meter_events (clinic_id, meter_key, occurred_at desc);
create index if not exists webhook_events_provider_status_idx on public.webhook_events (provider, processing_status, received_at desc);
create index if not exists consent_records_patient_idx on public.consent_records (clinic_id, patient_id, channel);
create index if not exists data_subject_requests_clinic_status_idx on public.data_subject_requests (clinic_id, status, due_at);
create index if not exists audit_events_clinic_created_idx on public.audit_events (clinic_id, created_at desc);

create trigger set_patient_leads_updated_at before update on public.patient_leads
for each row execute function public.set_updated_at();
create trigger set_missed_call_recovery_workflows_updated_at before update on public.missed_call_recovery_workflows
for each row execute function public.set_updated_at();
create trigger set_communication_provider_accounts_updated_at before update on public.communication_provider_accounts
for each row execute function public.set_updated_at();
create trigger set_billing_customers_updated_at before update on public.billing_customers
for each row execute function public.set_updated_at();
create trigger set_subscription_records_updated_at before update on public.subscription_records
for each row execute function public.set_updated_at();
create trigger set_invoice_records_updated_at before update on public.invoice_records
for each row execute function public.set_updated_at();
create trigger set_data_subject_requests_updated_at before update on public.data_subject_requests
for each row execute function public.set_updated_at();

alter table public.patient_leads enable row level security;
alter table public.missed_call_recovery_workflows enable row level security;
alter table public.communication_provider_accounts enable row level security;
alter table public.sms_events enable row level security;
alter table public.ai_conversation_audit_logs enable row level security;
alter table public.dashboard_metric_snapshots enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscription_records enable row level security;
alter table public.usage_meter_events enable row level security;
alter table public.invoice_records enable row level security;
alter table public.webhook_events enable row level security;
alter table public.consent_records enable row level security;
alter table public.data_subject_requests enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "members can read clinics" on public.clinics;
create policy "members can read clinics" on public.clinics
for select using (public.is_clinic_member(id));

drop policy if exists "owners and admins can update clinics" on public.clinics;
create policy "owners and admins can update clinics" on public.clinics
for update using (public.has_clinic_role(id, array['owner', 'admin']))
with check (public.has_clinic_role(id, array['owner', 'admin']));

drop policy if exists "authenticated users can create clinics" on public.clinics;
create policy "authenticated users can create clinics" on public.clinics
for insert with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists "members can read profiles" on public.profiles;
create policy "members can read profiles" on public.profiles
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "users can update their profile" on public.profiles;
create policy "users can update their profile" on public.profiles
for update using (user_id = auth.uid() and public.is_clinic_member(clinic_id))
with check (user_id = auth.uid() and public.is_clinic_member(clinic_id));

drop policy if exists "users can create their profile" on public.profiles;
create policy "users can create their profile" on public.profiles
for insert with check (user_id = auth.uid() and public.is_clinic_member(clinic_id));

drop policy if exists "members can read memberships" on public.clinic_members;
create policy "members can read memberships" on public.clinic_members
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "owners and admins can manage memberships" on public.clinic_members;
create policy "owners and admins can manage memberships" on public.clinic_members
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "clinic creators can create owner membership" on public.clinic_members;
create policy "clinic creators can create owner membership" on public.clinic_members
for insert with check (user_id = auth.uid() and role = 'owner' and status = 'active');

drop policy if exists "members can read patients" on public.patients;
create policy "members can read patients" on public.patients
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "patient writers can manage patients" on public.patients;
create policy "patient writers can manage patients" on public.patients
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']));

drop policy if exists "members can read calls" on public.calls;
create policy "members can read calls" on public.calls
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage calls" on public.calls;
create policy "ops roles can manage calls" on public.calls
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "members can read conversations" on public.conversations;
create policy "members can read conversations" on public.conversations
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage conversations" on public.conversations;
create policy "ops roles can manage conversations" on public.conversations
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']));

drop policy if exists "members can read conversation messages" on public.conversation_messages;
create policy "members can read conversation messages" on public.conversation_messages
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage conversation messages" on public.conversation_messages;
create policy "ops roles can manage conversation messages" on public.conversation_messages
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']));

drop policy if exists "members can read campaigns" on public.campaigns;
create policy "members can read campaigns" on public.campaigns
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "managers can manage campaigns" on public.campaigns;
create policy "managers can manage campaigns" on public.campaigns
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager']));

drop policy if exists "members can read recovery opportunities" on public.recovery_opportunities;
create policy "members can read recovery opportunities" on public.recovery_opportunities
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage recovery opportunities" on public.recovery_opportunities;
create policy "ops roles can manage recovery opportunities" on public.recovery_opportunities
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "members can read patient leads" on public.patient_leads;
create policy "members can read patient leads" on public.patient_leads
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage patient leads" on public.patient_leads;
create policy "ops roles can manage patient leads" on public.patient_leads
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "members can read missed call workflows" on public.missed_call_recovery_workflows;
create policy "members can read missed call workflows" on public.missed_call_recovery_workflows
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "ops roles can manage missed call workflows" on public.missed_call_recovery_workflows;
create policy "ops roles can manage missed call workflows" on public.missed_call_recovery_workflows
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist']));

drop policy if exists "admins can manage provider accounts" on public.communication_provider_accounts;
create policy "admins can manage provider accounts" on public.communication_provider_accounts
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "members can read sms events" on public.sms_events;
create policy "members can read sms events" on public.sms_events
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "members can read ai audit logs" on public.ai_conversation_audit_logs;
create policy "members can read ai audit logs" on public.ai_conversation_audit_logs
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "members can read dashboard metrics" on public.dashboard_metric_snapshots;
create policy "members can read dashboard metrics" on public.dashboard_metric_snapshots
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "admins can read billing customers" on public.billing_customers;
create policy "admins can read billing customers" on public.billing_customers
for select using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "admins can read subscriptions" on public.subscription_records;
create policy "admins can read subscriptions" on public.subscription_records
for select using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "admins can read usage events" on public.usage_meter_events;
create policy "admins can read usage events" on public.usage_meter_events
for select using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "admins can read invoices" on public.invoice_records;
create policy "admins can read invoices" on public.invoice_records
for select using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "members can read consent records" on public.consent_records;
create policy "members can read consent records" on public.consent_records
for select using (public.is_clinic_member(clinic_id));

drop policy if exists "patient writers can manage consent records" on public.consent_records;
create policy "patient writers can manage consent records" on public.consent_records
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin', 'manager', 'receptionist', 'clinician']));

drop policy if exists "admins can manage data subject requests" on public.data_subject_requests;
create policy "admins can manage data subject requests" on public.data_subject_requests
for all using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "admins can read audit events" on public.audit_events;
create policy "admins can read audit events" on public.audit_events
for select using (clinic_id is null or public.has_clinic_role(clinic_id, array['owner', 'admin']));

comment on table public.patient_leads is 'Clinic-scoped patient lead pipeline without seed/demo records.';
comment on table public.missed_call_recovery_workflows is 'Provider-neutral missed-call recovery workflow state for SMS, phone, email, or WhatsApp.';
comment on table public.sms_events is 'Audit-safe SMS event log, Twilio-ready without storing credentials.';
comment on table public.ai_conversation_audit_logs is 'AI and human approval audit history for patient conversations.';
comment on table public.dashboard_metric_snapshots is 'Materialised clinic KPI snapshots for low-cost dashboards.';
comment on table public.billing_customers is 'Stripe-ready billing customer mapping; no Stripe calls happen in the database.';
comment on table public.subscription_records is 'Provider-neutral subscription lifecycle state machine.';
comment on table public.usage_meter_events is 'Append-only usage metering foundation for quotas and billing.';
comment on table public.webhook_events is 'Idempotent provider webhook ingestion ledger for Twilio, Stripe, Supabase, and internal events.';
comment on table public.consent_records is 'UK GDPR-conscious consent and lawful-basis history.';
comment on table public.data_subject_requests is 'Data subject request workflow tracking with 30-day default due date.';
comment on table public.audit_events is 'Audit-safe internal event log for financial, access, and operational actions.';
