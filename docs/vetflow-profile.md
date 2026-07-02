# VetFlow Profile

VetFlow is the veterinary services profile running on the shared Flow Platform.

## What VetFlow changes

- Veterinary terminology and routing language
- Warm, reassuring British receptionist tone
- Safety-first triage for collapse, breathing difficulty, poisoning, bleeding, and trauma
- Veterinary appointment and prescription booking rules
- Green brand palette and paw-print style identity

## What VetFlow inherits

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

- Pet emergency
- New pet appointment
- Existing pet appointment
- Vaccination booking
- Neutering booking
- Prescription request
- Pricing enquiry
- Complaint
- Message for reception

## Core entities

- Full name
- Phone
- Email
- Pet name
- Pet type
- Breed
- Symptoms
- Age
- Medication
- Preferred visit time
- Appointment preference

## Voice and messaging

- Voice: `Polly.Amy-Neural`
- SSML: enabled
- Greeting: calm veterinary receptionist welcome
- Closing: practical handoff to the team
- SMS: missed-call recovery and follow-up wording tailored to veterinary enquiries
- Email: callback and booking follow-up wording tailored to veterinary enquiries

## Validation

VetFlow is considered valid when the profile has voice, templates, workflows, branding, prompts, navigation metadata, notification rules, emergency rules, booking rules, and AI configuration.
