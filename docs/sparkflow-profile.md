# SparkFlow Profile

SparkFlow is the electrical services profile running on the shared Flow Platform.

## What SparkFlow changes

- Electrical terminology and routing language
- Warm, confident British receptionist tone
- Safety-first triage for outages, consumer unit faults, shocks, and burning smells
- Electrical quote and service booking rules
- Amber brand palette and zap iconography

## What SparkFlow inherits

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

- Power outage
- Lighting fault
- Consumer unit issue
- EV charger fault
- Rewire quote
- Routine service
- Safety issue

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
- Appointment preference
- Asset
- Equipment

## Voice and messaging

- Voice: `Polly.Amy-Neural`
- SSML: enabled
- Greeting: calm electrician receptionist welcome
- Closing: practical handoff to the team
- SMS: missed-call recovery and follow-up wording tailored to electrical enquiries
- Email: quote and callback follow-up wording tailored to electrical enquiries

## Validation

SparkFlow is considered valid when the profile has voice, templates, workflows, branding, prompts, navigation metadata, notification rules, emergency rules, booking rules, and AI configuration.
