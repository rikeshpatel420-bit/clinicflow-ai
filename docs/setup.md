# ClinicFlow AI Setup

## Local Setup

1. Open the app folder:

```powershell
cd C:\Users\Rikesh\.openclaw\workspace\clinicflow-ai
```

2. Install dependencies:

```powershell
npm install
```

3. Create local environment variables:

```powershell
copy .env.example .env.local
```

4. For demo mode, leave Supabase, Twilio, Stripe, and OpenAI values blank.

5. Start the app:

```powershell
npm run dev
```

6. Open:

```txt
http://localhost:3000
```

## Production Checks

Run before deployment:

```powershell
npm run lint
npm run build
```

## Demo Data

When Supabase is not configured, pages use deterministic local demo data. This keeps the product browsable without real patient data or external services.

## Live Provider Rule

Do not add live Twilio, Stripe, OpenAI, or other provider credentials until the matching integration phase is approved.

