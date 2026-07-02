# Workflow Engine

The Flow Platform Workflow Engine is the reusable orchestration layer for every Flow vertical.

It lets a profile describe what should happen after events like:

- inbound calls
- missed calls
- emergency detection
- new leads
- appointment requests
- messages
- quote requests
- human transfer requests
- follow-up reminders
- payment reminders
- review reminders

## Core concepts

### Workflow definition

Each workflow defines:

- workflow id
- name
- profile id
- trigger
- status
- conditions
- steps
- actions
- fallback
- audit trail

### Triggers

Triggers are the high-level events that start a workflow.

Examples:

- `inbound_call_completed`
- `missed_call`
- `emergency_detected`
- `new_lead_created`
- `appointment_requested`
- `message_received`
- `quote_requested`
- `human_transfer_requested`
- `follow_up_due`

### Conditions

Conditions decide whether a workflow should run for the current event.

Common fields:

- intent
- urgency
- customer type
- business hours
- service category
- postcode
- profile id
- confidence score
- existing customer
- AI response failure

### Actions

Actions describe the work the workflow should perform.

Supported action families:

- create lead
- create task
- update customer
- send SMS
- send email
- notify staff
- schedule callback
- escalate
- add note
- assign owner
- create booking request
- update call summary
- mark recovery status
- trigger webhook

### Fallback

Fallback keeps the workflow safe when conditions fail or a step cannot complete.

The fallback path should always preserve the live experience and hand over to a human when needed.

### Audit trail

The engine can emit audit events so the platform can show:

- what matched
- what ran
- what failed
- what fell back

## Execution model

1. A trigger event enters the engine
2. The active profile is loaded
3. Matching workflows are found
4. Workflow conditions are evaluated
5. Workflow steps run in order
6. Actions are executed through registered handlers
7. Results are recorded
8. Audit events are written where available
9. Failures fall back safely without breaking the call flow

## Adding a new workflow

1. Add a workflow definition to the relevant profile
2. Choose the trigger
3. Add conditions for the event you care about
4. Add steps and actions
5. Define a fallback path
6. Keep the workflow active only when it is ready for production
7. Run the workflow smoke test

## Why this matters

This layer is what makes Flow Platform reusable.

ClinicFlow can stay focused on dental reception, while PlumbFlow, BuildFlow, EstateFlow, SparkFlow, HeatFlow, and future products each describe their own workflows through configuration only.
