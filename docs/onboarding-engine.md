# Onboarding Engine

The onboarding engine creates a real business workspace and a generated configuration package from one wizard.

## What it does

It turns a business setup form into:

- a clinic workspace
- an owner membership
- a profile row for the tenant
- a brand engine summary
- a prompt studio summary
- a knowledge base summary
- a booking abstraction summary
- an organisation model summary
- a settings engine summary
- a business self-validation report

## Where it lives

- `src/lib/onboarding/engine.ts`
- `src/lib/onboarding/persistence.ts`
- `src/lib/onboarding/types.ts`
- `src/app/onboarding/page.tsx`
- `src/app/onboarding/actions.ts`

## Inputs

The wizard collects:

- business name
- industry
- owner name and contact details
- logo and colours
- voice personality
- greeting
- AI prompt
- questions to ask
- required customer information
- emergency rules
- booking behaviour
- calendar provider
- SMS templates
- email templates
- escalation rules
- dashboard wording
- CRM fields
- workflow stages
- follow-up cadence

## Output

The onboarding engine generates a reusable package preview that can be reused by the rest of the platform.

## Persistence

The engine creates the clinic workspace and ensures a profile row exists. When onboarding completes, it marks `profiles.onboarding_completed_at`.

## Validation

The self-check reports whether the business setup is complete enough to launch.

## How to extend it

1. Add a new field to `BusinessOnboardingBlueprint`
2. Map the field into the form
3. Add a section in `engine.ts`
4. Add a validation check
5. Document the new behaviour

## Why it matters

It keeps business creation configuration-driven and makes the setup process predictable for every new Flow product.

