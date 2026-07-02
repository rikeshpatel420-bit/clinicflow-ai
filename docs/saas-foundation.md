# Flow Platform SaaS Foundation

Flow Platform already has the pieces a multi-tenant SaaS needs. This layer ties them together so the product surface can stay generic while individual verticals remain configuration-driven.

## Core ideas

- Tenant scope is clinic-first and must be enforced on every data path.
- Roles and permissions describe who can manage clinics, billing, teams, and recovery.
- Feature flags control rollouts without branching product code.
- Billing stays abstracted behind reusable plans, quotas, and entitlement checks.
- API keys, audit logging, and readiness checks stay server-side and never expose secrets.

## Shared modules

- `src/lib/tenancy/context.ts`
- `src/lib/backend/tenant-scope.ts`
- `src/lib/permissions/roles.ts`
- `src/lib/billing/*`
- `src/lib/platform/config.ts`
- `src/lib/platform/providers.ts`
- `src/lib/security/audit.ts`
- `src/lib/system/readiness.ts`
- `src/lib/saas/*`

## How the foundation page works

The internal `/platform/foundation` route composes:

- active profile metadata
- installed profiles and validation summaries
- tenant isolation rules
- billing tiers and quotas
- feature flags
- API key readiness
- permissions
- providers and audit surfaces
- production readiness blockers

## Adding a future Flow product

1. Create the vertical profile in `src/lib/flow-platform/profiles/`.
2. Define voice, intents, workflows, templates, and dashboard labels.
3. Add the profile to the registry.
4. Verify the profile with the validator.
5. Let the factory generate the starter config and smoke tests.

## Why this matters

This structure keeps commercial logic, platform primitives, and product-specific behaviour separate. That makes it easier to launch another Flow product without rewriting the base app.
