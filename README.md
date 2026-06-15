# ClinicFlow AI

Production-oriented demo scaffold for a multi-tenant healthcare operations SaaS focused on clinic revenue recovery, patient communication, analytics, and enterprise operations.

## Current Mode

- Deterministic demo data only.
- Supabase-ready auth and tenant patterns.
- Stripe, Twilio, and OpenAI are placeholders only.
- No external API calls are required to run locally.

## Local Development

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Verification

```powershell
npm run lint
npm run build
```

## Key Folders

- `src/app` - App Router pages and API placeholders.
- `src/components` - reusable UI, layout, and domain components.
- `src/config` - central app and navigation config.
- `src/lib` - domain logic, demo data, utilities, and integration abstractions.
- `src/types` - shared database types.
- `supabase` - migration and seed foundations.
- `docs` - setup, architecture, deployment, and onboarding notes.

## Deployment

Use Vercel for the Next.js app. Keep external provider credentials empty until live Supabase, Stripe, Twilio, and OpenAI phases are intentionally enabled.

