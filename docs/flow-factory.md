# Flow Factory

Flow Factory is the configuration wizard for new Flow products.

## What it does

It turns a business blueprint into a generated package containing:

- profile configuration
- route plan
- dashboard wording
- voice profile
- AI prompt
- notification templates
- workflow definitions
- documentation
- smoke tests

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

## Output format

The wizard generates a package preview that can be saved into a new profile folder and registered in the Flow Platform catalog.

## How this helps

The shared platform remains stable while each new vertical is described through configuration instead of bespoke product code.

## Usage pattern

1. Open `/factory`
2. Fill out the blueprint
3. Generate the package
4. Save the resulting profile into a new product folder
5. Register the profile in the Flow Platform registry
6. Switch `FLOW_PLATFORM_PROFILE_ID` when you want the runtime to use it

## Notes

- ClinicFlow stays the first live profile.
- PlumbFlow, BuildFlow, EstateFlow, SparkFlow, and future profiles can follow the same pattern.
- The factory output is safe to reuse because it does not touch the live clinic runtime until the profile is registered.
