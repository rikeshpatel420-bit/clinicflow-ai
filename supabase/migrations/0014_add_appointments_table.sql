create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  lead_id uuid references public.patient_leads(id) on delete set null,
  call_id uuid references public.calls(id) on delete set null,
  booking_request_id uuid unique references public.booking_requests(id) on delete set null,
  patient_name text,
  patient_email text,
  patient_phone text,
  treatment_type text not null default 'general',
  appointment_start timestamptz not null,
  appointment_end timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'reschedule_needed')),
  confirmation_reference text not null unique,
  source text not null default 'ai_call' check (source in ('ai_call', 'manual', 'dashboard')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (appointment_end > appointment_start)
);

create index if not exists appointments_clinic_start_idx on public.appointments (clinic_id, appointment_start desc);
create index if not exists appointments_clinic_status_idx on public.appointments (clinic_id, status, appointment_start desc);
create index if not exists appointments_call_idx on public.appointments (call_id);
create index if not exists appointments_booking_request_idx on public.appointments (booking_request_id);
create index if not exists appointments_lead_idx on public.appointments (lead_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_appointments_updated_at') then
    create trigger set_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.appointments enable row level security;

drop policy if exists "owners and admins can read appointments" on public.appointments;
create policy "owners and admins can read appointments" on public.appointments
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can manage appointments" on public.appointments;
create policy "owners and admins can manage appointments" on public.appointments
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));
