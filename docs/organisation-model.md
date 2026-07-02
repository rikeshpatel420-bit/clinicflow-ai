# Organisation Model

The organisation model represents the business that owns the workspace.

## Core fields

- business name
- owner name
- owner email
- business phone
- business email
- website
- address
- timezone
- service radius
- business hours

## Storage behaviour

The onboarding flow creates the clinic workspace and ensures the tenant profile row exists. The profile row can later be marked complete once the business is ready to launch.

## Why it matters

It separates the business identity from the shared platform layer and keeps every tenant scoped correctly.

## Future extension

This model can later support:

- multiple locations
- departments
- brands under one organisation
- multi-region scheduling
- role-based operating policies

