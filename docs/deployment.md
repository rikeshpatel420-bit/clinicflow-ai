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

## Safe Initial Deployment

Deploy first in demo mode:

- Leave `TWILIO_AUTH_TOKEN` blank.
- Leave Stripe variables blank.
- Leave `OPENAI_API_KEY` blank.
- Keep `TWILIO_WEBHOOK_TEST_MODE=true`.

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

