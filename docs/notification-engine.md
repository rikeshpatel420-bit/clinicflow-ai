# Notification Engine

The Flow Platform notification engine is profile-aware and transport-aware.

## Supported channels

- SMS
- Email
- WhatsApp interface
- Push interface
- Internal staff notifications

## How it works

1. Load the active profile
2. Resolve a template from the shared registry
3. Merge in profile overrides
4. Render template variables
5. Send through an available transport when one exists
6. Record the dispatch outcome for audit and timeline use

## Design rules

- Templates are reusable across products
- Profiles can override wording without changing engine code
- Missing WhatsApp or push credentials should not break the engine
- Every dispatch should be auditable

