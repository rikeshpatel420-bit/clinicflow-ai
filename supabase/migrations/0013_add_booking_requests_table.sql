create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  lead_id uuid references public.patient_leads(id) on delete set null,
  patient_id uuid,
  confirmation_reference text not null unique,
  source text not null default 'voice' check (source in ('voice', 'sms', 'manual', 'web')),
  booking_type text not null default 'appointment_request',
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'failed')),
  preferred_time text,
  next_step text,
  notes text,
  requested_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists booking_requests_clinic_requested_idx on public.booking_requests (clinic_id, requested_at desc);
create index if not exists booking_requests_call_idx on public.booking_requests (call_id);
create index if not exists booking_requests_lead_idx on public.booking_requests (lead_id);
create index if not exists booking_requests_patient_idx on public.booking_requests (patient_id);
create index if not exists booking_requests_status_idx on public.booking_requests (clinic_id, status, requested_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_booking_requests_updated_at') then
    create trigger set_booking_requests_updated_at before update on public.booking_requests for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.booking_requests enable row level security;

drop policy if exists "owners and admins can read booking requests" on public.booking_requests;
create policy "owners and admins can read booking requests" on public.booking_requests
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can manage booking requests" on public.booking_requests;
create policy "owners and admins can manage booking requests" on public.booking_requests
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));
