# Twilio Setup

This phase is test-mode only. No live SMS is sent and no real Twilio credentials are required yet.

## Current Routes

Voice webhook placeholder:

```txt
/api/webhooks/twilio/voice
```

Status webhook placeholder:

```txt
/api/webhooks/twilio/status
```

Both routes accept `POST` requests and use the placeholder signature verification helper.

## Environment Variables

```txt
TWILIO_AUTH_TOKEN=
TWILIO_WEBHOOK_TEST_MODE=true
```

Keep `TWILIO_WEBHOOK_TEST_MODE=true` during local development.

## Current Safety Rules

- Signature verification is placeholder-only.
- Live verification is intentionally not implemented.
- SMS sending is disabled.
- The SMS service only creates a recovery draft.
- Webhook routes do not require real credentials in test mode.
- No AI auto-replies are connected.

## Missed-Call Detection

The missed-call detector treats these Twilio call statuses as missed:

- `busy`
- `canceled`
- `failed`
- `no-answer`

Missed calls receive an initial recovery state:

```txt
recovery_status = queued
recovery_next_action = Draft recovery SMS for staff review.
```

Answered calls are closed by default:

```txt
recovery_status = closed
```

## Later Live Integration

Before going live:

1. Implement real Twilio signature verification.
2. Store the Twilio Account SID and Auth Token securely.
3. Add clinic phone number mapping.
4. Persist webhook events into the `calls` table.
5. Add staff approval before SMS recovery sending.
6. Add monitoring and audit logs.

Do not enable live SMS until recovery templates, compliance language, and opt-out handling are reviewed.
