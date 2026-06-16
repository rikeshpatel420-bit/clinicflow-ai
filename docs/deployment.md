# Deployment Preparation

## Vercel Readiness

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Set the framework preset to Next.js.
4. Use the default build command:

```txt
npm run build
```

5. Add environment variables from `.env.example`.

## Required Production Variables

Set these before handling real clinic data:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

Full variable descriptions are in `docs/production-backend.md`.

## Safe Initial Deployment

Deploy first with Supabase enabled and provider integrations disabled:

- Leave `TWILIO_AUTH_TOKEN` blank.
- Leave Stripe variables blank.
- Leave `OPENAI_API_KEY` blank.
- Keep `TWILIO_WEBHOOK_TEST_MODE=true`.

Before launch, apply Supabase migrations:

```powershell
supabase db push
```

## Required Preflight

```powershell
npm run lint
npm run build
```

## Health Check

After deployment, verify:

```txt
/api/system/health
```
