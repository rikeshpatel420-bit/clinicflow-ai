# Security and GDPR

Flow OS is designed to be safe for multi-tenant UK SaaS use.

## Security principles

- secrets stay server-side
- the browser only sees public environment values
- clinic data is always scoped before access
- audit trails are written for sensitive operations
- webhook handlers should validate signatures where required

## GDPR notes

- call transcripts and summaries should be retained only for the approved retention window
- notifications should not expose secrets or unnecessary personal data
- exports should be explicit and tenant-scoped
- deletion and retention workflows should be documented before commercial rollout

## Operational notes

- keep RLS assumptions visible in the readiness dashboard
- use service-role access only inside server helpers
- keep audit records and timeline items separate from raw secrets
