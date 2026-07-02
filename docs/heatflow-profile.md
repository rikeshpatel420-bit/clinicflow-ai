# HeatFlow Profile

HeatFlow is the heating services profile running on the shared Flow Platform.

## What HeatFlow changes

- Heating terminology and routing language
- Warm, reassuring British receptionist tone
- Safety-first triage for boiler failures, heating loss, and hot-water outages
- Heating quote and service booking rules
- Rose brand palette and flame iconography

## What HeatFlow inherits

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

- Boiler failure
- No heating
- No hot water
- Underfloor heating
- Heat pump issue
- Service booking
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
- Appointment preference
- Asset
- Equipment

## Voice and messaging

- Voice: `Polly.Amy-Neural`
- SSML: enabled
- Greeting: calm heating receptionist welcome
- Closing: practical handoff to the team
- SMS: missed-call recovery and follow-up wording tailored to heating enquiries
- Email: quote and callback follow-up wording tailored to heating enquiries

## Validation

HeatFlow is considered valid when the profile has voice, templates, workflows, branding, prompts, navigation metadata, notification rules, emergency rules, booking rules, and AI configuration.
