# PlumbFlow Profile

PlumbFlow is the plumbing and trade-services profile running on the shared Flow Platform.

## What PlumbFlow changes

- Plumbing terminology and routing language
- Warm, practical British receptionist tone
- Safety-first triage for leaks, bursts, boiler faults, and gas smells
- Plumbing-focused booking and quote rules
- Blue brand palette and wrench iconography

## What PlumbFlow inherits

- Shared conversation engine
- Shared voice engine
- Shared workflow engine
- Shared notification engine
- Shared event bus, audit engine, timeline engine, and customer model
- Shared Flow Factory generation and validation

## Core workflows

- Answer inbound call
- Continue voice conversation
- Send missed-call recovery SMS
- Persist the call and lead
- Generate the call summary
- Escalate safety issues

## Key intents

- Emergency leak
- Burst pipe
- Boiler issue
- Blocked drain
- No hot water
- Underfloor heating
- Bathroom quote
- Kitchen plumbing
- Gas smell or safety escalation
- Routine service
- Quote request

## Core entities

- Full name
- Phone
- Email
- Postcode
- Address
- Property type
- Issue
- Urgency
- Preferred visit time
- Access notes
- Photos requested

## Voice and messaging

- Voice: `Polly.Brian-Neural`
- SSML: enabled
- Greeting: calm plumbing receptionist welcome
- Closing: practical handoff to the team
- SMS: missed-call recovery and follow-up wording tailored to plumbing
- Email: quote and callback follow-up wording tailored to plumbing

## Validation

PlumbFlow is considered valid when the profile has voice, templates, workflows, branding, prompts, navigation metadata, notification rules, emergency rules, booking rules, and AI configuration.
