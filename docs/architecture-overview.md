# ClinicFlow AI Architecture Overview

## Current Scaffold

ClinicFlow AI is currently scaffolded as a Next.js App Router application with TypeScript, Tailwind CSS, and Supabase client setup.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase JavaScript client

## Application Areas

- Landing page for the product entry point
- Login page placeholder for Supabase authentication
- Dashboard placeholder for clinic operations
- Supabase client wrapper for future authentication and data access

## Initial Structure

```txt
clinicflow-ai/
  docs/
    setup.md
    architecture-overview.md
  src/
    app/
      dashboard/
        page.tsx
      login/
        page.tsx
      globals.css
      layout.tsx
      page.tsx
    lib/
      supabase/
        client.ts
  .env.example
```

## Next Architecture Step

The next step is to add Supabase authentication and the first database schema for clinics, users, clinic membership, and patients.

## Not Included Yet

- Twilio
- Stripe
- OpenAI workflows
- Production database schema
- Row Level Security policies
- Deployment configuration
