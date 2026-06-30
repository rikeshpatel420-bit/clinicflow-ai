create table if not exists public.twilio_connections (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  account_sid text not null,
  voice_number text not null,
  forward_to_number text not null,
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

