# SaaS Readiness

The commercial control plane lives in `/saas`. It answers one question: can this tenant go live?

## Readiness checks

- Voice configured
- AI configured
- Billing configured
- Onboarding complete
- Workflows active
- Notifications ready
- Calendar connected
- Emergency rules configured
- Profile valid
- Production URLs and webhook endpoints set

## Score

The readiness score is a simple completion ratio across the current launch checklist. A tenant is considered go-live ready when all critical checks are complete and no blockers remain.

## What operators should look for

- `Go-live ready` should be true
- `Blockers` should be empty
- Twilio should point to the production webhook URLs
- OpenAI, Supabase, and billing env checks should be green
- The active profile should validate cleanly

## Related routes

- `/saas`
- `/system`
- `/platform`
- `/platform/foundation`
- `/platform/profiles`
