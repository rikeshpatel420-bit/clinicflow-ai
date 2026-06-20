alter table public.patient_leads drop constraint if exists patient_leads_status_check;
alter table public.patient_leads
  add constraint patient_leads_status_check check (
    status in ('new', 'contacted', 'qualified', 'booked', 'won', 'lost', 'recovered', 'opted_out', 'archived')
  );

alter table public.recovery_workflows drop constraint if exists recovery_workflows_state_check;
alter table public.recovery_workflows
  add constraint recovery_workflows_state_check check (
    state in (
      'queued',
      'sms_sent',
      'replied',
      'booked',
      'lost',
      'recovered',
      'opted_out',
      'drafted',
      'awaiting_staff_approval',
      'message_queued',
      'awaiting_patient_reply',
      'closed',
      'failed'
    )
  );
