insert into public.clinics (id, name, slug, status, timezone, phone)
values
  ('11111111-1111-4111-8111-111111111111', 'Demo Dental Clinic', 'demo-dental-clinic', 'active', 'Europe/London', '+44 20 7946 0000')
on conflict (slug) do nothing;

insert into public.patients (id, clinic_id, full_name, preferred_name, email, phone, status, source, notes)
values
  (
    '22222222-2222-4222-8222-222222222221',
    '11111111-1111-4111-8111-111111111111',
    'Amelia Carter',
    'Amelia',
    'amelia@example.test',
    '+44 7700 900123',
    'lead',
    'phone',
    'Interested in a new consultation.'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Noah Patel',
    'Noah',
    'noah@example.test',
    '+44 7700 900456',
    'active',
    'manual',
    'Needs a reschedule follow-up.'
  )
on conflict (clinic_id, phone) do nothing;

insert into public.calls (
  id,
  clinic_id,
  patient_id,
  direction,
  status,
  caller_number,
  clinic_number,
  started_at,
  duration_seconds,
  summary,
  recovery_status,
  recovery_next_action,
  recovery_updated_at
)
values
  (
    '33333333-3333-4333-8333-333333333331',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'inbound',
    'missed',
    '+44 7700 900123',
    '+44 20 7946 0000',
    now() - interval '2 hours',
    null,
    'Missed new consultation enquiry.',
    'queued',
    'Draft recovery SMS for staff review.',
    now() - interval '2 hours'
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    'inbound',
    'answered',
    '+44 7700 900456',
    '+44 20 7946 0000',
    now() - interval '1 day',
    184,
    'Patient called about rescheduling.',
    'closed',
    'No recovery needed.',
    now() - interval '1 day'
  )
on conflict (id) do nothing;

insert into public.conversations (
  id,
  clinic_id,
  patient_id,
  channel,
  status,
  priority,
  subject,
  ai_summary,
  follow_up_state,
  last_message_at
)
values
  (
    '44444444-4444-4444-8444-444444444441',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222221',
    'sms',
    'open',
    'urgent',
    'New consultation enquiry',
    'Placeholder summary: patient wants pricing and earliest consultation availability.',
    'awaiting_reply',
    now()
  )
on conflict (id) do nothing;

insert into public.conversation_messages (
  id,
  clinic_id,
  conversation_id,
  sender_type,
  direction,
  body,
  delivery_status,
  ai_generated,
  sent_at
)
values
  (
    '55555555-5555-4555-8555-555555555551',
    '11111111-1111-4111-8111-111111111111',
    '44444444-4444-4444-8444-444444444441',
    'patient',
    'inbound',
    'Hi, I missed your call. Can you tell me consultation availability?',
    'received',
    false,
    now()
  )
on conflict (id) do nothing;

insert into public.campaigns (id, clinic_id, name, status, audience, message_template, follow_up_state)
values (
  '66666666-6666-4666-8666-666666666661',
  '11111111-1111-4111-8111-111111111111',
  'Hygiene recall draft',
  'draft',
  'inactive_patients',
  'Hi {{first_name}}, you are due for a hygiene appointment. Reply to book.',
  'not_started'
)
on conflict (id) do nothing;

insert into public.recovery_opportunities (
  id,
  clinic_id,
  call_id,
  patient_id,
  stage,
  priority_score,
  estimated_revenue_pence,
  booked_at,
  next_action
)
values
  (
    '77777777-7777-4777-8777-777777777771',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333331',
    '22222222-2222-4222-8222-222222222221',
    'booked',
    92,
    35000,
    now() - interval '1 hour',
    'Confirm consultation attendance.'
  ),
  (
    '77777777-7777-4777-8777-777777777772',
    '11111111-1111-4111-8111-111111111111',
    null,
    '22222222-2222-4222-8222-222222222222',
    'contacted',
    76,
    18000,
    null,
    'Follow up with reschedule options.'
  )
on conflict (id) do nothing;

-- Profiles and clinic_members depend on real Supabase auth user IDs.
-- After creating a local auth user, insert a matching profile and membership:
--
-- insert into public.profiles (clinic_id, user_id, full_name, email, onboarding_completed_at)
-- values (
--   '11111111-1111-4111-8111-111111111111',
--   '<auth-user-id>',
--   'Demo Owner',
--   'owner@example.test',
--   now()
-- );
--
-- insert into public.clinic_members (clinic_id, user_id, role, status, joined_at)
-- values (
--   '11111111-1111-4111-8111-111111111111',
--   '<auth-user-id>',
--   'owner',
--   'active',
--   now()
-- );
