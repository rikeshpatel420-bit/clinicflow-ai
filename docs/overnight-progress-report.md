# Overnight Progress Report

## Completed

- Reusable Flow Platform profile system added
- Active profile runtime selector added
- ClinicFlow profile cleaned into profile data
- PlumbFlow profile added as the second vertical
- SparkFlow and HeatFlow profile skeletons added
- BuildFlow and EstateFlow profile skeletons added
- `/platform` now shows the active profile plus the profile catalog
- Profile detail pages added under `/platform/profiles/[profileId]`
- Shared profile builder added for common contact entities and templates
- Shared conversation labels made more profile-driven
- Neutral `caseSummary` template added for broader vertical support
- Architecture docs updated

## Validation

- `npm run lint`
- `npm run build`
- `npm run flow-platform:smoke`
- Local smoke checks for:
  - `/`
  - `/platform`
  - `/platform/profiles/buildflow`
  - `/platform/profiles/estateflow`
  - `/platform/profiles/plumbflow`
  - `/platform/profiles/sparkflow`
  - `/platform/profiles/heatflow`
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
- SparkFlow and HeatFlow are intentionally lightweight skeletons so the platform can prove config-only expansion.

## Next steps

1. Add a profile detail preview page for internal browsing.
2. Add a lightweight profile smoke check script.
3. Continue refactoring repeated profile scaffolding into shared helpers.
