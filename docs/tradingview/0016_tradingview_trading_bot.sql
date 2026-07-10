create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tradingview_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  received_at timestamptz not null default now(),
  triggered_at timestamptz,
  strategy text,
  strategy_version text,
  ticker text,
  exchange text,
  timeframe text,
  action text,
  price numeric,
  quantity numeric,
  payload_hash text,
  nonce text,
  processing_status text not null default 'RECEIVED',
  rejection_reason text,
  operating_mode text not null default 'SIGNAL_ONLY',
  remote_key_hash text,
  redacted_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tradingview_webhook_events_event_id_uidx
  on public.tradingview_webhook_events(event_id)
  where event_id is not null;

create unique index if not exists tradingview_webhook_events_payload_hash_accepted_uidx
  on public.tradingview_webhook_events(payload_hash)
  where payload_hash is not null and processing_status in ('ACCEPTED', 'QUEUED', 'PROCESSED');

create unique index if not exists tradingview_webhook_events_nonce_accepted_uidx
  on public.tradingview_webhook_events(nonce)
  where nonce is not null and processing_status in ('ACCEPTED', 'QUEUED', 'PROCESSED');

create index if not exists tradingview_webhook_events_received_at_idx
  on public.tradingview_webhook_events(received_at desc);

drop trigger if exists set_tradingview_webhook_events_updated_at on public.tradingview_webhook_events;
create trigger set_tradingview_webhook_events_updated_at
  before update on public.tradingview_webhook_events
  for each row execute function public.set_updated_at();

create table if not exists public.trading_signals (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  received_at timestamptz not null,
  triggered_at timestamptz not null,
  strategy text not null,
  strategy_version text not null,
  ticker text not null,
  exchange text not null,
  timeframe text not null,
  action text not null,
  price numeric not null,
  quantity numeric not null,
  payload_hash text not null unique,
  nonce text not null unique,
  processing_status text not null default 'QUEUED',
  rejection_reason text,
  operating_mode text not null default 'SIGNAL_ONLY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_trading_signals_updated_at on public.trading_signals;
create trigger set_trading_signals_updated_at
  before update on public.trading_signals
  for each row execute function public.set_updated_at();

create table if not exists public.webhook_nonces (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  nonce text not null unique,
  payload_hash text not null,
  received_at timestamptz not null default now(),
  triggered_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists webhook_nonces_payload_hash_uidx
  on public.webhook_nonces(payload_hash);

drop trigger if exists set_webhook_nonces_updated_at on public.webhook_nonces;
create trigger set_webhook_nonces_updated_at
  before update on public.webhook_nonces
  for each row execute function public.set_updated_at();

create table if not exists public.proposed_orders (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  received_at timestamptz not null,
  triggered_at timestamptz not null,
  strategy text not null,
  strategy_version text not null,
  ticker text not null,
  exchange text not null,
  timeframe text not null,
  action text not null,
  price numeric not null,
  quantity numeric not null,
  payload_hash text not null unique,
  nonce text not null unique,
  processing_status text not null default 'PAPER_SIMULATED',
  rejection_reason text,
  order_status text not null default 'PAPER_SIMULATED',
  estimated_consideration numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_proposed_orders_updated_at on public.proposed_orders;
create trigger set_proposed_orders_updated_at
  before update on public.proposed_orders
  for each row execute function public.set_updated_at();

create table if not exists public.manual_ii_orders (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  received_at timestamptz,
  triggered_at timestamptz,
  strategy text,
  strategy_version text,
  ticker text not null,
  exchange text not null,
  timeframe text,
  action text not null,
  price numeric,
  quantity numeric,
  payload_hash text,
  nonce text,
  processing_status text not null default 'PROPOSED',
  rejection_reason text,
  instrument_name text not null,
  ii_ticker text not null,
  approved_gbp_risk_amount numeric,
  calculated_quantity numeric,
  latest_known_price numeric,
  latest_known_price_at timestamptz,
  order_status text not null default 'PROPOSED',
  copyable_order_summary text,
  manual_execution jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_manual_ii_orders_updated_at on public.manual_ii_orders;
create trigger set_manual_ii_orders_updated_at
  before update on public.manual_ii_orders
  for each row execute function public.set_updated_at();

create table if not exists public.portfolio_imports (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  received_at timestamptz default now(),
  triggered_at timestamptz,
  strategy text,
  strategy_version text,
  ticker text,
  exchange text,
  timeframe text,
  action text,
  price numeric,
  quantity numeric,
  payload_hash text unique,
  nonce text unique,
  processing_status text not null default 'IMPORTED',
  rejection_reason text,
  account_identifier text not null,
  import_type text not null,
  source_filename text,
  column_mapping jsonb not null default '{}'::jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  imported_rows jsonb not null default '[]'::jsonb,
  approved_for_ledger boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_portfolio_imports_updated_at on public.portfolio_imports;
create trigger set_portfolio_imports_updated_at
  before update on public.portfolio_imports
  for each row execute function public.set_updated_at();

create table if not exists public.reconciliation_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  received_at timestamptz default now(),
  triggered_at timestamptz,
  strategy text,
  strategy_version text,
  ticker text,
  exchange text,
  timeframe text,
  action text,
  price numeric,
  quantity numeric,
  payload_hash text unique,
  nonce text unique,
  processing_status text not null default 'PENDING_APPROVAL',
  rejection_reason text,
  reconciliation_rows jsonb not null default '[]'::jsonb,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_reconciliation_events_updated_at on public.reconciliation_events;
create trigger set_reconciliation_events_updated_at
  before update on public.reconciliation_events
  for each row execute function public.set_updated_at();

create table if not exists public.trading_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  received_at timestamptz not null default now(),
  triggered_at timestamptz,
  strategy text,
  strategy_version text,
  ticker text,
  exchange text,
  timeframe text,
  action text,
  price numeric,
  quantity numeric,
  payload_hash text,
  nonce text,
  processing_status text not null,
  rejection_reason text,
  remote_key_hash text,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trading_audit_log_received_at_idx
  on public.trading_audit_log(received_at desc);

create index if not exists trading_audit_log_status_idx
  on public.trading_audit_log(processing_status, received_at desc);

drop trigger if exists set_trading_audit_log_updated_at on public.trading_audit_log;
create trigger set_trading_audit_log_updated_at
  before update on public.trading_audit_log
  for each row execute function public.set_updated_at();

alter table public.tradingview_webhook_events enable row level security;
alter table public.trading_signals enable row level security;
alter table public.webhook_nonces enable row level security;
alter table public.proposed_orders enable row level security;
alter table public.manual_ii_orders enable row level security;
alter table public.portfolio_imports enable row level security;
alter table public.reconciliation_events enable row level security;
alter table public.trading_audit_log enable row level security;

drop policy if exists tradingview_webhook_events_service_role_all on public.tradingview_webhook_events;
create policy tradingview_webhook_events_service_role_all
  on public.tradingview_webhook_events
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists trading_signals_service_role_all on public.trading_signals;
create policy trading_signals_service_role_all
  on public.trading_signals
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists webhook_nonces_service_role_all on public.webhook_nonces;
create policy webhook_nonces_service_role_all
  on public.webhook_nonces
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists proposed_orders_service_role_all on public.proposed_orders;
create policy proposed_orders_service_role_all
  on public.proposed_orders
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists manual_ii_orders_service_role_all on public.manual_ii_orders;
create policy manual_ii_orders_service_role_all
  on public.manual_ii_orders
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists portfolio_imports_service_role_all on public.portfolio_imports;
create policy portfolio_imports_service_role_all
  on public.portfolio_imports
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists reconciliation_events_service_role_all on public.reconciliation_events;
create policy reconciliation_events_service_role_all
  on public.reconciliation_events
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists trading_audit_log_service_role_all on public.trading_audit_log;
create policy trading_audit_log_service_role_all
  on public.trading_audit_log
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.reload_trading_postgrest_schema()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_notify('pgrst', 'reload schema');
end;
$$;

create or replace function public.accept_tradingview_webhook_event(
  p_event_id text,
  p_received_at timestamptz,
  p_triggered_at timestamptz,
  p_strategy text,
  p_strategy_version text,
  p_ticker text,
  p_exchange text,
  p_timeframe text,
  p_action text,
  p_price numeric,
  p_quantity numeric,
  p_payload_hash text,
  p_nonce text,
  p_operating_mode text,
  p_remote_key_hash text,
  p_redacted_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.tradingview_webhook_events where event_id = p_event_id) then
    insert into public.trading_audit_log (
      event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
      action, price, quantity, payload_hash, nonce, processing_status, rejection_reason, remote_key_hash, message
    ) values (
      p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
      p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'REJECTED', 'Duplicate TradingView event_id.', p_remote_key_hash, 'Duplicate signal rejected transactionally.'
    );
    return jsonb_build_object('accepted', false, 'status', 409, 'reason', 'Duplicate signal rejected.');
  end if;

  if exists (select 1 from public.webhook_nonces where nonce = p_nonce or payload_hash = p_payload_hash) then
    insert into public.trading_audit_log (
      event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
      action, price, quantity, payload_hash, nonce, processing_status, rejection_reason, remote_key_hash, message
    ) values (
      p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
      p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'REJECTED', 'Replay nonce or payload hash already exists.', p_remote_key_hash, 'Replay rejected transactionally.'
    );
    return jsonb_build_object('accepted', false, 'status', 409, 'reason', 'Replay or duplicate payload rejected.');
  end if;

  insert into public.webhook_nonces (
    event_id, nonce, payload_hash, received_at, triggered_at, expires_at
  ) values (
    p_event_id, p_nonce, p_payload_hash, p_received_at, p_triggered_at, p_received_at + interval '24 hours'
  );

  insert into public.tradingview_webhook_events (
    event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
    action, price, quantity, payload_hash, nonce, processing_status, operating_mode, remote_key_hash, redacted_payload
  ) values (
    p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
    p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'ACCEPTED', p_operating_mode, p_remote_key_hash, p_redacted_payload
  );

  insert into public.trading_signals (
    event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
    action, price, quantity, payload_hash, nonce, processing_status, operating_mode
  ) values (
    p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
    p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'QUEUED', p_operating_mode
  );

  if p_operating_mode = 'PAPER' and p_action in ('BUY', 'SELL', 'REDUCE') then
    insert into public.proposed_orders (
      event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
      action, price, quantity, payload_hash, nonce, processing_status, order_status, estimated_consideration
    ) values (
      p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
      p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'PAPER_SIMULATED', 'PAPER_SIMULATED', p_price * p_quantity
    );
  end if;

  insert into public.trading_audit_log (
    event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
    action, price, quantity, payload_hash, nonce, processing_status, remote_key_hash, message
  ) values (
    p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
    p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'ACCEPTED', p_remote_key_hash, 'TradingView signal stored durably.'
  );

  return jsonb_build_object('accepted', true, 'status', 202, 'reason', 'Queued for durable processing.');
exception
  when unique_violation then
    insert into public.trading_audit_log (
      event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
      action, price, quantity, payload_hash, nonce, processing_status, rejection_reason, remote_key_hash, message
    ) values (
      p_event_id, p_received_at, p_triggered_at, p_strategy, p_strategy_version, p_ticker, p_exchange, p_timeframe,
      p_action, p_price, p_quantity, p_payload_hash, p_nonce, 'REJECTED', 'Unique constraint rejected duplicate webhook.', p_remote_key_hash, 'Duplicate signal rejected by database constraint.'
    );
    return jsonb_build_object('accepted', false, 'status', 409, 'reason', 'Duplicate signal rejected.');
end;
$$;

create or replace function public.reject_tradingview_webhook_event(
  p_event_id text,
  p_received_at timestamptz,
  p_triggered_at timestamptz,
  p_strategy text,
  p_strategy_version text,
  p_ticker text,
  p_exchange text,
  p_timeframe text,
  p_action text,
  p_price numeric,
  p_quantity numeric,
  p_payload_hash text,
  p_nonce text,
  p_operating_mode text,
  p_remote_key_hash text,
  p_rejection_reason text,
  p_redacted_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tradingview_webhook_events (
    event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
    action, price, quantity, payload_hash, nonce, processing_status, rejection_reason, operating_mode, remote_key_hash, redacted_payload
  ) values (
    nullif(p_event_id, ''), p_received_at, p_triggered_at, nullif(p_strategy, ''), nullif(p_strategy_version, ''),
    nullif(p_ticker, ''), nullif(p_exchange, ''), nullif(p_timeframe, ''), nullif(p_action, ''),
    p_price, p_quantity, p_payload_hash, p_nonce, 'REJECTED', p_rejection_reason, p_operating_mode, p_remote_key_hash, p_redacted_payload
  )
  on conflict do nothing;

  insert into public.trading_audit_log (
    event_id, received_at, triggered_at, strategy, strategy_version, ticker, exchange, timeframe,
    action, price, quantity, payload_hash, nonce, processing_status, rejection_reason, remote_key_hash, message
  ) values (
    nullif(p_event_id, ''), p_received_at, p_triggered_at, nullif(p_strategy, ''), nullif(p_strategy_version, ''),
    nullif(p_ticker, ''), nullif(p_exchange, ''), nullif(p_timeframe, ''), nullif(p_action, ''),
    p_price, p_quantity, p_payload_hash, p_nonce, 'REJECTED', p_rejection_reason, p_remote_key_hash, 'TradingView alert rejected.'
  );
end;
$$;
