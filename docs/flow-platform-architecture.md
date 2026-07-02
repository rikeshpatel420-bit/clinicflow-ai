# Flow Platform Architecture

Flow Platform is the reusable core. ClinicFlow is the first product profile running on it.

## Layers

1. Core platform
   - Shared conversation engine
   - Shared workflow primitives
   - Shared template helpers
   - Shared profile builder and contact entity presets
   - Shared registry and profile loading
   - Shared Flow Factory generator and wizard helpers

2. Industry configuration
   - Domain terminology
   - Industry-safe defaults
   - Generic knowledge prompts

3. Clinic configuration
   - Brand colours
   - Locale
   - Business hours
   - Appointment rules

4. Conversation profile
   - Intent definitions
   - Entity definitions
   - Follow-up questions
   - Summary templates
   - SMS and email templates
   - Urgency, escalation, and recovery rules

5. Voice profile
   - Twilio voice
   - Speech rate
   - SSML settings
   - Greeting
   - Closing line
   - Emergency fallback

6. Knowledge base
   - Safe response prompts
   - Business rules
   - Clarification prompts

7. Actions
   - Workflow definitions
   - Trigger registry
   - Condition builder
   - Action catalog
   - Workflow executor
   - Notification rules
   - Recovery rules

8. Dashboard profile
   - Colours
   - Icons
   - Labels

9. Flow Factory
   - Blueprint capture wizard
   - Generated route plans
   - Generated documentation
   - Generated smoke tests

## Folder structure

```text
src/lib/flow-platform/
  core.ts
  factory.ts
  index.ts
  profile-builder.ts
  registry.ts
  runtime.ts
  catalog.ts
  workflow-engine.ts
  types.ts
  profiles/
    buildflow.ts
    clinicflow.ts
    estateflow.ts
    heatflow.ts
    plumbflow.ts
    sparkflow.ts
src/lib/flow-factory/
  generator.ts
  index.ts
  types.ts
```

## How to add a new Flow product

1. Create a new profile file in `src/lib/flow-platform/profiles/`
2. Define:
   - industry metadata
   - clinic branding
   - voice profile
   - conversation intents
   - entity rules
   - templates
   - workflows
   - workflow triggers
   - workflow actions
   - workflow fallback rules
3. Wrap the exported profile with `createFlowPlatformProfile()` or `defineFlowPlatformProfile()` to keep the shape consistent
4. Reuse the shared helpers in `src/lib/flow-platform/profile-builder.ts` for contact entities, summary templates, message templates, knowledge base, and workflow definitions
5. Register the profile in `src/lib/flow-platform/registry.ts`
6. Add or update the profile catalog view in `/platform` if you want to expose it in the UI
7. Set `FLOW_PLATFORM_PROFILE_ID` if you want to switch away from the default profile
8. Point the product runtime at that profile through `getActiveFlowPlatformProfile()`
9. Use Flow Factory to generate the new product package, documentation, and smoke tests from a configuration wizard

## How to add intents

1. Add a new `FlowIntentDefinition`
2. Give it:
   - a stable key
   - human-readable label
   - keywords
   - follow-up question
   - summary hint
3. Reuse the shared conversation engine

## How to add entities

1. Add a `FlowEntityDefinition`
2. Provide:
   - a stable entity key
   - a label
   - regex patterns
   - optional normalisation
3. Reference the entity from the relevant profile

## How to create a voice profile

1. Choose the Twilio voice
2. Set the speech rate
3. Define the greeting and closing
4. Add emergency and fallback prompts
5. Turn on SSML only when the voice works well with it

## How to create workflows

1. Define the workflow key and trigger
2. Declare the communication channel
3. Add conditions, actions, and fallback behaviour
4. Keep the runtime generic so the profile selects behaviour
5. Use the workflow executor to evaluate the trigger, conditions, steps, and audit trail

## Workflow engine model

The reusable workflow engine treats each workflow as configuration:

- `trigger` decides when the workflow can run
- `conditions` decide whether it is relevant for the current event
- `steps` group the actions into safe execution chunks
- `actions` describe what should happen
- `fallback` defines the safe recovery path
- `status` controls whether the workflow is active
- `auditTrail` describes what should be recorded

This means a vertical can define reception, escalation, follow-up, and recovery behaviour without adding bespoke product logic to the core platform.

## ClinicFlow today

ClinicFlow uses the Flow Platform profile in:

- Twilio voice triage
- AI reception classification
- SMS recovery messages
- AI call summaries
- workflow prompt versions

That means future products can reuse the same engine and only swap the profile.

PlumbFlow now proves that another vertical can live alongside ClinicFlow without changing the core platform.

SparkFlow and HeatFlow now act as additional vertical skeletons so new products can be added without touching the conversation engine.

BuildFlow and EstateFlow now show the same pattern in construction and property, using the shared profile builder instead of copy-pasted setup code.

Flow Factory adds a configuration layer on top of the profile registry so new verticals can be described once and packaged without touching the platform core.
The workflow engine sits underneath those profiles so every product can describe what happens after an enquiry, missed call, booking request, escalation, or follow-up event.

## Active profile selection

The runtime resolves the active profile from:

1. `FLOW_PLATFORM_PROFILE_ID`
2. The default profile, `clinicflow`

This keeps ClinicFlow as the first live configuration while making the platform ready for PlumbFlow, SparkFlow, HeatFlow, VetFlow, LegalFlow, and other future products later.
