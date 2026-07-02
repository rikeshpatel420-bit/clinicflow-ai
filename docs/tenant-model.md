# Tenant Model

Flow OS is built around tenant isolation first.

## Layers

1. Organisation
   - The commercial customer or account
2. Workspace
   - The active operating space for a product profile
3. Branch
   - A location or operational sub-unit inside a workspace
4. User
   - The authenticated person
5. Role
   - The permission group assigned to a user
6. Permissions
   - The allowed actions inside the tenant

## Current behaviour

- ClinicFlow resolves the active clinic membership from Supabase.
- The workspace is clinic-scoped.
- Server-side helpers build tenant filters before protected reads and writes.

## Commercial view

The `/saas` control plane presents the current tenant as:

- organisation
- workspace
- active clinic
- branch count
- role
- permission set
- feature flags

## Rules

- Always scope records by `clinic_id`
- Keep service-role access inside server-only helpers
- Treat feature flags and billing as tenant-specific data
