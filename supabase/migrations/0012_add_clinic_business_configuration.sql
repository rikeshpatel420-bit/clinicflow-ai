alter table public.clinics
  add column if not exists business_configuration jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_draft jsonb not null default '{}'::jsonb,
  add column if not exists launch_state jsonb not null default '{}'::jsonb;

update public.clinics
set
  business_configuration = coalesce(business_configuration, '{}'::jsonb),
  onboarding_draft = coalesce(onboarding_draft, '{}'::jsonb),
  launch_state = coalesce(launch_state, '{}'::jsonb);

