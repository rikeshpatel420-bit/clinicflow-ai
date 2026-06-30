alter table public.recovery_workflows
  add column if not exists patient_id uuid references public.patients(id) on delete set null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patient_leads'
      and column_name = 'patient_id'
  ) then
    update public.recovery_workflows rw
    set patient_id = pl.patient_id
    from public.patient_leads pl
    where rw.lead_id = pl.id
      and rw.patient_id is null
      and pl.patient_id is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'calls'
      and column_name = 'patient_id'
  ) then
    update public.recovery_workflows rw
    set patient_id = c.patient_id
    from public.calls c
    where rw.call_id = c.id
      and rw.patient_id is null
      and c.patient_id is not null;
  end if;
end;
$$;

create index if not exists recovery_workflows_clinic_patient_idx
  on public.recovery_workflows (clinic_id, patient_id)
  where deleted_at is null;

create index if not exists recovery_workflows_clinic_lead_idx
  on public.recovery_workflows (clinic_id, lead_id)
  where deleted_at is null;

create index if not exists recovery_workflows_clinic_call_idx
  on public.recovery_workflows (clinic_id, call_id)
  where deleted_at is null;
