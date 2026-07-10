# TradingView and Interactive Investor Manual Bridge Setup

This project accepts TradingView alerts for PAPER and SIGNAL_ONLY modes only. Real-money order execution is disabled.

## Security Rules

- Do not enter a TradingView password anywhere in this app.
- Do not enter an Interactive Investor username, password, recovery code, one-time code, or session cookie anywhere in this app.
- Do not automate, scrape, or simulate clicks against Interactive Investor.
- Do not bypass two-factor authentication.
- Interactive Investor order approval creates a manual instruction only. It does not place a trade.

## Environment

Create a high-entropy secret outside source control:

```bash
TRADINGVIEW_WEBHOOK_SECRET="<set in Vercel as an encrypted environment variable>"
SUPABASE_URL="<set in Vercel as an encrypted environment variable>"
SUPABASE_SERVICE_ROLE_KEY="<set in Vercel as an encrypted environment variable>"
APP_BASE_URL="https://semi-swing-bot.vercel.app"
SIGNAL_MODE="SIGNAL_ONLY"
LIVE_TRADING_ENABLED="false"
```

Allowed `SIGNAL_MODE` values are `SIGNAL_ONLY` and `PAPER`. Do not add a live mode.

## Database Migration

Apply `supabase/migrations/0016_tradingview_trading_bot.sql` before enabling the production webhook.

If you have a linked Supabase CLI session:

```bash
supabase db push
```

If CLI access is not available, open the Supabase SQL editor and run the full SQL from:

```text
supabase/migrations/0016_tradingview_trading_bot.sql
```

The migration creates durable tables for webhook events, signals, nonces, proposed orders, manual II orders, portfolio imports, reconciliation events, and trading audit logs. It also creates transactional RPC functions used by the webhook route for replay protection and idempotency.

## Webhook URL

```text
https://semi-swing-bot.vercel.app/webhooks/tradingview
```

The endpoint requires HTTPS, `Content-Type: application/json`, the configured secret, fresh timestamps, database-backed nonce/replay protection, idempotency, and rate limiting.

Health endpoint:

```text
https://semi-swing-bot.vercel.app/api/trading/webhook-health
```

## TradingView Alert JSON

Use the example in `docs/tradingview/example-alert.json`. Replace `{{WEBHOOK_SECRET}}` in TradingView with the generated secret. Do not commit the real secret.

## User Setup Process

1. Start the application.
2. Generate the TradingView webhook secret.
3. Deploy the HTTPS webhook.
4. Open TradingView.
5. Add the supplied Pine strategy from `docs/tradingview/semi_trend_pullback_v1.pine`.
6. Create the TradingView alert.
7. Paste the webhook URL.
8. Paste the generated JSON message.
9. Trigger a connection test.
10. Confirm receipt in the bot on `/connections`.
11. Import the II opening portfolio.
12. Reconcile current positions.
13. Run only in SIGNAL_ONLY or PAPER mode.
14. Generate and manually place a test-sized II order.

## Interactive Investor Import Format

Portfolio snapshot CSV fields can be mapped flexibly:

```csv
Account,Ticker,ISIN,Exchange,Quantity,Book Cost,Currency
ISA-001,AMD,US0079031078,NASDAQ,3,410.25,USD
```

Transaction history CSV fields can also be mapped flexibly:

```csv
Account,Transaction ID,Ticker,ISIN,Exchange,Quantity,Price,Currency,Transaction Date,Settlement Date,Fees
ISA-001,II-123,AMD,US0079031078,NASDAQ,1,172.24,USD,2026-07-10,2026-07-12,3.99
```

The importer validates account identifier, ticker, ISIN, exchange, quantity, book cost, currency, transaction dates, settlement dates, fees, and duplicate transaction IDs.

## Remaining Limitations

- Durable webhook receipt, replay protection, signals, and audit records require `supabase/migrations/0016_tradingview_trading_bot.sql` to be applied.
- The Interactive Investor bridge is manual only and has no live broker integration.
- Reconciliation changes require manual approval before the system ledger is changed.
- Vercel can receive webhooks and write durable records, but any long-running signal processing should move to a queue-backed worker.
