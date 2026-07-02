# Flow Platform Architecture

Flow Platform is the reusable core. ClinicFlow is the first product profile running on it.

## Layers

1. Core platform
   - Shared conversation engine
   - Shared workflow primitives
   - Shared template helpers
   - Shared notification engine
   - Shared event bus
   - Shared audit engine
   - Shared timeline engine
   - Shared customer 360 model
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
   - Audit trail integration
   - Event emission

8. Dashboard profile
   - Colours
   - Icons
   - Labels

9. Internal profile validation
   - Shared profile comparison page
   - Mandatory section checks
   - Missing-configuration reporting

10. Customer onboarding
   - Business setup wizard
   - Brand engine
   - Prompt studio
   - Knowledge base
   - Booking abstraction
   - Organisation model
   - Settings engine
   - Business self-validation

11. Flow Factory
   - Blueprint capture wizard
   - Generated route plans
   - Generated documentation
   - Generated smoke tests
   - Default profile bundles
   - Default workflow blueprints
   - Default notification templates
   - Navigation and dashboard defaults
   - Validator-ready profile summaries

12. SaaS foundation
   - Tenant isolation helpers
   - Roles and permissions matrix
   - Billing abstractions and usage limits
   - Feature flags and rollout controls
   - API key policy and secret visibility rules
   - Audit and production-readiness snapshot
   - Internal `/platform/foundation` view

## Folder structure

```text
src/lib/flow-platform/
  core.ts
  audit.ts
  factory.ts
  health.ts
  validator.ts
  notifications.ts
  events.ts
  index.ts
  customer.ts
  profile-builder.ts
  registry.ts
  runtime.ts
  catalog.ts
  templates.ts
  timeline.ts
  workflow-engine.ts
  types.ts
  profiles/
    buildflow.ts
    clinicflow.ts
    estateflow.ts
    heatflow.ts
    plumbflow.ts
    sparkflow.ts
    vetflow.ts
src/lib/onboarding/
  engine.ts
  persistence.ts
  types.ts
src/app/platform/
  page.tsx
  profiles/page.tsx
  profiles/[profileId]/page.tsx
  workflows/page.tsx
src/app/onboarding/
  actions.ts
  business-onboarding-wizard.tsx
  page.tsx
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
9. Use Flow Factory and the customer onboarding engine to generate the new product package, documentation, and smoke tests from configuration wizards

## Shared platform services

### Notification Engine

The Notification Engine resolves a profile-aware template, renders variables, and hands the result to an available transport. SMS and email can send immediately when a transport is registered. WhatsApp and push are supported at the interface layer so future connectors can plug in without changing product code. Internal notifications and dashboard updates remain first-class even when an external transport is not available.

### Template Registry

The template registry keeps the canonical notification messages in one place. Each profile can override wording while inheriting the common structure for appointment confirmations, reminders, missed-call recovery, quote follow-up, emergency escalation, payment reminders, review requests, booking receipts, new leads, and human transfer messages.

### Event Bus

The event bus is the platform communication layer. Modules publish events such as `call.completed`, `lead.created`, `workflow.completed`, and `notification.sent`, while other modules can subscribe without direct coupling.

### Audit Engine

The audit engine writes a reusable record for workflow executions, notifications, AI interactions, bookings, escalations, and transfers. Audit records can be transformed into timeline items or sent onto the event bus.

### Timeline Engine

The timeline engine merges calls, SMS, emails, bookings, notes, tasks, AI summaries, notifications, and workflow history into one chronological customer feed.

### Customer 360 model

The customer model holds shared contact details, tags, communication history, summaries, tasks, appointments, and placeholder invoice hooks so every Flow product can grow into the same customer record shape.

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
- profile-aware templates and notifications
- reusable audit records and timeline items

That means future products can reuse the same engine and only swap the profile.

PlumbFlow now proves that another vertical can live alongside ClinicFlow without changing the core platform.

SparkFlow and HeatFlow now act as additional vertical skeletons so new products can be added without touching the conversation engine.

BuildFlow and EstateFlow now show the same pattern in construction and property, using the shared profile builder instead of copy-pasted setup code.

Flow Factory adds a configuration layer on top of the profile registry so new verticals can be described once and packaged without touching the platform core.
Customer onboarding adds a business-instance layer on top of that so a tenant can be created, branded, validated, and marked ready without writing bespoke setup code.
The workflow engine sits underneath those profiles so every product can describe what happens after an enquiry, missed call, booking request, escalation, or follow-up event.
The profile comparison page at `/platform/profiles` shows the installed product set, validation state, workflow counts, template counts, and shared inheritance so the team can verify that a new vertical only changes configuration.

## Active profile selection

The runtime resolves the active profile from:

1. `FLOW_PLATFORM_PROFILE_ID`
2. The default profile, `clinicflow`

This keeps ClinicFlow as the first live configuration while making the platform ready for PlumbFlow, SparkFlow, HeatFlow, VetFlow, LegalFlow, and other future products later.
