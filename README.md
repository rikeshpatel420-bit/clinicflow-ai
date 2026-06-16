# ClinicFlow AI

Production-oriented multi-tenant healthcare operations SaaS focused on clinic revenue recovery, patient communication, analytics, and enterprise operations.

## Current Mode

- Supabase backend with tenant-scoped database migrations and Row Level Security.
- Empty production seed: no fake clinics, patients, communications, or billing records are inserted.
- Stripe, Twilio, and OpenAI remain provider-ready abstractions only.
- The UI can still run locally without provider API calls.

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

## Backend Setup

Apply Supabase migrations before using real production data:

```powershell
supabase db push
```

Read the backend contract and environment variable guide:

- `docs/production-backend.md`
- `docs/database-schema.md`

## Deployment

Use Vercel for the Next.js app. Add Supabase production variables first, then enable Stripe, Twilio, and OpenAI variables only when those integrations are intentionally launched.

