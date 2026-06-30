create table if not exists public.call_recordings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete cascade,
  provider text not null default 'twilio' check (provider in ('twilio', 'manual')),
  provider_recording_id text not null unique,
  recording_url text not null,
  recording_duration_seconds integer,
  status text not null default 'available' check (status in ('queued', 'available', 'transcribing', 'transcribed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.call_recordings
  add column if not exists clinic_id uuid references public.clinics(id) on delete cascade;

alter table public.call_recordings
  add column if not exists call_id uuid references public.calls(id) on delete cascade;

alter table public.call_recordings
  add column if not exists provider text not null default 'twilio';

alter table public.call_recordings
  add column if not exists provider_recording_id text;

alter table public.call_recordings
  add column if not exists recording_url text;

alter table public.call_recordings
  add column if not exists recording_duration_seconds integer;

alter table public.call_recordings
  add column if not exists status text not null default 'available';

alter table public.call_recordings
  add column if not exists started_at timestamptz;

alter table public.call_recordings
  add column if not exists completed_at timestamptz;

alter table public.call_recordings
  add column if not exists created_at timestamptz not null default now();

alter table public.call_recordings
  add column if not exists updated_at timestamptz not null default now();

alter table public.call_recordings
  add column if not exists deleted_at timestamptz;

create index if not exists call_recordings_clinic_created_idx on public.call_recordings (clinic_id, created_at desc);
create index if not exists call_recordings_call_idx on public.call_recordings (call_id);
create index if not exists call_recordings_provider_idx on public.call_recordings (provider, provider_recording_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_call_recordings_updated_at') then
    create trigger set_call_recordings_updated_at before update on public.call_recordings for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.call_recordings enable row level security;

drop policy if exists "owners and admins can read call recordings" on public.call_recordings;
create policy "owners and admins can read call recordings" on public.call_recordings
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can manage call recordings" on public.call_recordings;
create policy "owners and admins can manage call recordings" on public.call_recordings
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));

create table if not exists public.voicemail_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete cascade,
  recording_id uuid references public.call_recordings(id) on delete set null,
  provider text not null default 'twilio' check (provider in ('twilio', 'manual')),
  provider_voicemail_id text not null unique,
  caller_number_hash text,
  caller_number_last4 text,
  transcript_text text,
  summary text,
  status text not null default 'received' check (status in ('received', 'transcribed', 'resolved', 'failed')),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.voicemail_messages
  add column if not exists clinic_id uuid references public.clinics(id) on delete cascade;

alter table public.voicemail_messages
  add column if not exists call_id uuid references public.calls(id) on delete cascade;

alter table public.voicemail_messages
  add column if not exists recording_id uuid references public.call_recordings(id) on delete set null;

alter table public.voicemail_messages
  add column if not exists provider text not null default 'twilio';

alter table public.voicemail_messages
  add column if not exists provider_voicemail_id text;

alter table public.voicemail_messages
  add column if not exists caller_number_hash text;

alter table public.voicemail_messages
  add column if not exists caller_number_last4 text;

alter table public.voicemail_messages
  add column if not exists transcript_text text;

alter table public.voicemail_messages
  add column if not exists summary text;

alter table public.voicemail_messages
  add column if not exists status text not null default 'received';

alter table public.voicemail_messages
  add column if not exists received_at timestamptz not null default now();

alter table public.voicemail_messages
  add column if not exists created_at timestamptz not null default now();

alter table public.voicemail_messages
  add column if not exists updated_at timestamptz not null default now();

alter table public.voicemail_messages
  add column if not exists deleted_at timestamptz;

create index if not exists voicemail_messages_clinic_created_idx on public.voicemail_messages (clinic_id, created_at desc);
create index if not exists voicemail_messages_call_idx on public.voicemail_messages (call_id);
create index if not exists voicemail_messages_recording_idx on public.voicemail_messages (recording_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_voicemail_messages_updated_at') then
    create trigger set_voicemail_messages_updated_at before update on public.voicemail_messages for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.voicemail_messages enable row level security;

drop policy if exists "owners and admins can read voicemail messages" on public.voicemail_messages;
create policy "owners and admins can read voicemail messages" on public.voicemail_messages
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can manage voicemail messages" on public.voicemail_messages;
create policy "owners and admins can manage voicemail messages" on public.voicemail_messages
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));

create table if not exists public.call_transcripts (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid references public.calls(id) on delete cascade,
  recording_id uuid references public.call_recordings(id) on delete set null,
  provider text not null default 'twilio' check (provider in ('twilio', 'openai', 'manual')),
  provider_transcript_id text not null unique,
  source text not null default 'speech' check (source in ('speech', 'voicemail', 'openai', 'manual')),
  transcript_text text not null,
  summary text,
  confidence numeric(5,2),
  language_code text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.call_transcripts
  add column if not exists clinic_id uuid references public.clinics(id) on delete cascade;

alter table public.call_transcripts
  add column if not exists call_id uuid references public.calls(id) on delete cascade;

alter table public.call_transcripts
  add column if not exists recording_id uuid references public.call_recordings(id) on delete set null;

alter table public.call_transcripts
  add column if not exists provider text not null default 'twilio';

alter table public.call_transcripts
  add column if not exists provider_transcript_id text;

alter table public.call_transcripts
  add column if not exists source text not null default 'speech';

alter table public.call_transcripts
  add column if not exists transcript_text text not null default '';

alter table public.call_transcripts
  add column if not exists summary text;

alter table public.call_transcripts
  add column if not exists confidence numeric(5,2);

alter table public.call_transcripts
  add column if not exists language_code text;

alter table public.call_transcripts
  add column if not exists status text not null default 'pending';

alter table public.call_transcripts
  add column if not exists created_at timestamptz not null default now();

alter table public.call_transcripts
  add column if not exists updated_at timestamptz not null default now();

alter table public.call_transcripts
  add column if not exists deleted_at timestamptz;

create index if not exists call_transcripts_clinic_created_idx on public.call_transcripts (clinic_id, created_at desc);
create index if not exists call_transcripts_call_idx on public.call_transcripts (call_id);
create index if not exists call_transcripts_recording_idx on public.call_transcripts (recording_id);
create index if not exists call_transcripts_provider_idx on public.call_transcripts (provider, provider_transcript_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_call_transcripts_updated_at') then
    create trigger set_call_transcripts_updated_at before update on public.call_transcripts for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.call_transcripts enable row level security;

drop policy if exists "owners and admins can read call transcripts" on public.call_transcripts;
create policy "owners and admins can read call transcripts" on public.call_transcripts
for select to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']));

drop policy if exists "owners and admins can manage call transcripts" on public.call_transcripts;
create policy "owners and admins can manage call transcripts" on public.call_transcripts
for all to authenticated
using (public.has_clinic_role(clinic_id, array['owner', 'admin']))
with check (public.has_clinic_role(clinic_id, array['owner', 'admin']));
