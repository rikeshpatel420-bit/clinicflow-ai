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

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  timezone text not null default 'Europe/London',
  phone text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'manager', 'receptionist', 'clinician', 'member')),
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  invited_email text,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  preferred_name text,
  email text,
  phone text,
  date_of_birth date,
  status text not null default 'active' check (status in ('active', 'lead', 'inactive', 'archived')),
  source text not null default 'manual' check (source in ('manual', 'website', 'phone', 'referral', 'import')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (clinic_id, phone)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  status text not null default 'missed' check (status in ('missed', 'answered', 'recovered', 'voicemail', 'queued')),
  caller_number text,
  clinic_number text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  summary text,
  recovery_status text not null default 'not_started' check (
    recovery_status in ('not_started', 'queued', 'sms_draft', 'awaiting_reply', 'recovered', 'closed', 'failed')
  ),
  recovery_next_action text,
  recovery_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  channel text not null default 'sms' check (channel in ('sms', 'phone', 'email', 'web')),
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent')),
  subject text not null,
  ai_summary text,
  follow_up_state text not null default 'not_started' check (
    follow_up_state in ('not_started', 'scheduled', 'awaiting_reply', 'completed', 'failed', 'paused')
  ),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('patient', 'staff', 'ai', 'system')),
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  delivery_status text not null default 'draft' check (
    delivery_status in ('draft', 'queued', 'sent', 'delivered', 'failed', 'received')
  ),
  ai_generated boolean not null default false,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'completed')),
  audience text not null default 'all_patients',
  message_template text not null,
  follow_up_state text not null default 'not_started' check (
    follow_up_state in ('not_started', 'scheduled', 'awaiting_reply', 'completed', 'failed', 'paused')
  ),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.recovery_opportunities (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  stage text not null default 'missed' check (stage in ('missed', 'contacted', 'replied', 'booked', 'lost')),
  priority_score integer not null default 50 check (priority_score >= 0 and priority_score <= 100),
  estimated_revenue_pence integer not null default 0,
  booked_at timestamptz,
  lost_reason text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index clinics_slug_idx on public.clinics (slug);
create index profiles_clinic_id_idx on public.profiles (clinic_id);
create index profiles_user_id_idx on public.profiles (user_id);
create index clinic_members_clinic_id_idx on public.clinic_members (clinic_id);
create index clinic_members_user_id_idx on public.clinic_members (user_id);
create index patients_clinic_id_idx on public.patients (clinic_id);
create index patients_clinic_id_status_idx on public.patients (clinic_id, status);
create index patients_clinic_id_created_at_idx on public.patients (clinic_id, created_at desc);
create index calls_clinic_id_idx on public.calls (clinic_id);
create index calls_clinic_id_status_idx on public.calls (clinic_id, status);
create index calls_clinic_id_recovery_status_idx on public.calls (clinic_id, recovery_status);
create index calls_clinic_id_started_at_idx on public.calls (clinic_id, started_at desc);
create index calls_patient_id_idx on public.calls (patient_id);
create index conversations_clinic_id_idx on public.conversations (clinic_id);
create index conversations_clinic_id_status_idx on public.conversations (clinic_id, status);
create index conversation_messages_conversation_id_idx on public.conversation_messages (conversation_id, sent_at);
create index campaigns_clinic_id_status_idx on public.campaigns (clinic_id, status);
create index recovery_opportunities_clinic_id_stage_idx on public.recovery_opportunities (clinic_id, stage);
create index recovery_opportunities_priority_idx on public.recovery_opportunities (clinic_id, priority_score desc);

create trigger set_clinics_updated_at
before update on public.clinics
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_clinic_members_updated_at
before update on public.clinic_members
for each row execute function public.set_updated_at();

create trigger set_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

create trigger set_calls_updated_at
before update on public.calls
for each row execute function public.set_updated_at();

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger set_recovery_opportunities_updated_at
before update on public.recovery_opportunities
for each row execute function public.set_updated_at();

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.clinic_members enable row level security;
alter table public.patients enable row level security;
alter table public.calls enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.campaigns enable row level security;
alter table public.recovery_opportunities enable row level security;

comment on table public.clinics is 'Tenant root for each clinic workspace.';
comment on table public.profiles is 'Application profile for each Supabase auth user.';
comment on table public.clinic_members is 'Tenant membership and role mapping.';
comment on table public.patients is 'Clinic-scoped patient CRM foundation.';
comment on table public.calls is 'Clinic-scoped call log foundation, provider-neutral until Twilio integration.';
comment on table public.conversations is 'Clinic-scoped patient communication thread.';
comment on table public.conversation_messages is 'Clinic-scoped timeline messages for conversations.';
comment on table public.campaigns is 'Clinic-scoped outbound campaign foundation.';
comment on table public.recovery_opportunities is 'Clinic-scoped revenue recovery pipeline for missed calls and lost leads.';
