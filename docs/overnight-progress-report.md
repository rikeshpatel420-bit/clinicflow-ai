# Overnight Progress Report

## Completed

- Reusable Flow Platform profile system added
- Active profile runtime selector added
- ClinicFlow profile cleaned into profile data
- PlumbFlow profile added as the second vertical
- Shared conversation labels made more profile-driven
- Neutral `caseSummary` template added for broader vertical support
- Architecture docs updated

## Validation

- `npm run lint`
- `npm run build`
- Local smoke checks for:
  - `/`
  - `/platform`
  - `/dashboard`
  - `/calls`
  - `/inbox`
  - `/patients`
  - `/integrations/twilio`
  - `/api/system/health`

## Notes

- ClinicFlow remains the default profile.
- `FLOW_PLATFORM_PROFILE_ID` now controls the active product profile.
- PlumbFlow is registered but still needs product-specific UI and operational polish before it is a real customer-facing product.

## Next steps

1. Finish any remaining generic label cleanup.
2. Add a second smoke path that demonstrates profile switching explicitly.
3. Decide which next vertical deserves the first live product experience.

