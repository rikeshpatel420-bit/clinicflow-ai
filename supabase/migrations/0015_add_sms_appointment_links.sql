alter table public.sms_events
  add column if not exists appointment_id uuid references public.appointments(id) on delete set null,
  add column if not exists booking_reference text;

create index if not exists sms_events_appointment_id_idx
  on public.sms_events(appointment_id)
  where appointment_id is not null;

create index if not exists sms_events_booking_reference_idx
  on public.sms_events(clinic_id, booking_reference)
  where booking_reference is not null;
