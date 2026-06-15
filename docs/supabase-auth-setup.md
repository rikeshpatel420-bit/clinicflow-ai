# Supabase Auth Setup

This app is prepared for Supabase authentication, but no real credentials are stored in the project yet.

## 1. Create a Supabase Project

1. Go to Supabase.
2. Create a new project.
3. Open the project dashboard.
4. Go to Project Settings.
5. Open API.

## 2. Copy Environment Values

Create a local `.env.local` file in the app root:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use the project URL and anon public key from Supabase.

Do not use the service role key in browser code.

## 3. Configure Auth Redirect URLs

In Supabase:

1. Go to Authentication.
2. Open URL Configuration.
3. Set Site URL to `http://localhost:3000` while developing locally.
4. Add redirect URLs:
   - `http://localhost:3000/login`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/forgot-password`

When deployed, add the Vercel production URL too.

## 4. Current App Routes

- `/login` is the login UI foundation.
- `/signup` is the signup UI foundation.
- `/forgot-password` is the password recovery UI foundation.
- `/dashboard` is the protected dashboard route.

The forms are intentionally not submitting real credentials yet. The next phase should add server actions for signup, login, logout, and password reset.

## 5. Protected Route Pattern

Protection currently exists in two places:

1. `middleware.ts` checks `/dashboard` and redirects unauthenticated users to `/login`.
2. `src/app/dashboard/page.tsx` also checks the current user on the server before rendering protected content.

If Supabase environment variables are missing, the middleware does not block local development. Once the variables are added, route protection turns on.

## 6. Run Locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## 7. Verify Before Deployment

Run:

```bash
npm run lint
npm run build
```

Both should pass before deploying.
