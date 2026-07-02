# Flow Factory

Flow Factory is the configuration wizard for new Flow products.

## What it does

It turns a business blueprint into a generated package containing:

- profile configuration
- route plan
- navigation defaults
- dashboard wording
- default dashboard cards
- voice profile
- AI prompt
- AI studio defaults
- tenant and workspace defaults
- billing readiness notes
- notification templates
- workflow blueprints
- workflow definitions
- documentation
- smoke tests
- sample automation rules

## What the wizard asks for

- Business name
- Industry
- Logo
- Colours
- Voice personality
- Greeting
- Questions to ask
- Required customer information
- Emergency rules
- Booking behaviour
- Calendar provider
- SMS templates
- Email templates
- AI prompt
- Escalation rules
- Dashboard wording
- CRM fields
- Workflow stages
- Follow-up cadence
- Navigation labels
- Default workflow stages
- Sample automation rules

## Output format

The wizard generates a package preview that can be saved into a new profile folder and registered in the Flow Platform catalog.

## How this helps

The shared platform remains stable while each new vertical is described through configuration instead of bespoke product code.

The generated package now sits beside the shared SaaS foundation, which means tenancy, billing, feature flags, permissions, audit logging, and isolation stay reusable while the profile changes independently.

## Usage pattern

1. Open `/factory`
2. Fill out the blueprint
3. Generate the package
4. Save the resulting profile into a new product folder
5. Register the profile in the Flow Platform registry
6. Switch `FLOW_PLATFORM_PROFILE_ID` when you want the runtime to use it
7. Open `/platform/foundation` to review the shared platform capabilities every generated product inherits
8. Open `/saas` to review the commercial control plane above the product layer

## Notes

- ClinicFlow stays the first live profile.
- PlumbFlow, BuildFlow, EstateFlow, SparkFlow, and future profiles can follow the same pattern.
- The factory output is safe to reuse because it does not touch the live clinic runtime until the profile is registered.
- Generated packages now also include default workflows, notification templates, navigation, voice profile data, prompt profile data, dashboard cards, and sample automation rules.
