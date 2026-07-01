# Flow Platform Architecture

Flow Platform is the reusable core. ClinicFlow is the first product profile running on it.

## Layers

1. Core platform
   - Shared conversation engine
   - Shared workflow primitives
   - Shared template helpers
   - Shared registry and profile loading

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
   - Notification rules
   - Recovery rules

## Folder structure

```text
src/lib/flow-platform/
  core.ts
  index.ts
  registry.ts
  runtime.ts
  types.ts
  profiles/
    clinicflow.ts
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
3. Register the profile in `src/lib/flow-platform/registry.ts`
4. Set `FLOW_PLATFORM_PROFILE_ID` if you want to switch away from the default profile
5. Point the product runtime at that profile through `getActiveFlowPlatformProfile()`

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
2. Assign the handler name
3. Declare the communication channel
4. Keep the runtime generic so the profile selects behaviour

## ClinicFlow today

ClinicFlow uses the Flow Platform profile in:

- Twilio voice triage
- AI reception classification
- SMS recovery messages
- AI call summaries
- workflow prompt versions

That means future products can reuse the same engine and only swap the profile.

## Active profile selection

The runtime resolves the active profile from:

1. `FLOW_PLATFORM_PROFILE_ID`
2. The default profile, `clinicflow`

This keeps ClinicFlow as the first live configuration while making the platform ready for PlumbFlow, SparkFlow, HeatFlow, VetFlow, or LegalFlow later.
