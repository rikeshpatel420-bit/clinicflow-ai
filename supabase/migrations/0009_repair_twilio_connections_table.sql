create table if not exists public.twilio_connections (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  account_sid text not null,
  encrypted_auth_token text,
  voice_number text not null,
  forward_to_number text not null,
  active boolean not null default false,
  auth_token_ciphertext text not null,
  auth_token_iv text not null,
  auth_token_tag text not null,
  status text not null default 'inactive' check (status in ('inactive', 'active', 'error')),
  last_validated_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.twilio_connections
  add column if not exists encrypted_auth_token text;

alter table public.twilio_connections
  add column if not exists active boolean not null default false;

alter table public.twilio_connections
  add column if not exists auth_token_ciphertext text;

alter table public.twilio_connections
  add column if not exists auth_token_iv text;

alter table public.twilio_connections
  add column if not exists auth_token_tag text;

alter table public.twilio_connections
  add column if not exists status text not null default 'inactive';

alter table public.twilio_connections
  add column if not exists last_validated_at timestamptz;

alter table public.twilio_connections
  add column if not exists last_error text;

alter table public.twilio_connections
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.twilio_connections
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.twilio_connections
  add column if not exists created_at timestamptz not null default now();

alter table public.twilio_connections
  add column if not exists updated_at timestamptz not null default now();

update public.twilio_connections
set encrypted_auth_token = coalesce(encrypted_auth_token, auth_token_ciphertext),
    active = case when status = 'active' then true else false end
where encrypted_auth_token is null
   or active is distinct from case when status = 'active' then true else false end;

create index if not exists twilio_connections_clinic_idx on public.twilio_connections (clinic_id);
create index if not exists twilio_connections_voice_number_idx on public.twilio_connections (voice_number);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_twilio_connections_updated_at') then
    create trigger set_twilio_connections_updated_at before update on public.twilio_connections for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.twilio_connections enable row level security;

drop policy if exists "owners and admins can read twilio connections" on public.twilio_connections;
create policy "owners and admins can read twilio connections" on public.twilio_connections
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can manage twilio connections" on public.twilio_connections;
create policy "owners and admins can manage twilio connections" on public.twilio_connections
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));
