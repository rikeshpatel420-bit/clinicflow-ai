# ClinicFlow Profile

ClinicFlow is the first production Flow Platform profile.

## What it is

- Industry: Dental
- Locale: `en-GB`
- Brand tone: warm, calm, premium, British
- Use case: missed-call recovery, appointment triage, patient follow-up

## Key intents

- dental emergency
- new patient appointment
- existing patient appointment
- cancellation or reschedule
- treatment enquiry
- pricing enquiry
- complaint
- message for reception
- other or unclear

## Core entities

- full name
- mobile number
- email
- preferred appointment time

## Voice behaviour

- Greeting: warm receptionist-style welcome
- Closing: reassuring handoff to the team
- Emergency behaviour: urgent escalation for breathing or swallowing difficulty
- Voice: `Polly.Amy-Neural`
- SSML: enabled

## Messaging

- Missed-call recovery SMS
- Reply-yes acknowledgement
- Opt-out and resubscribe responses

## Dashboard signals

- active calls
- missed calls
- recovery
- response rate
- recovered revenue

## Workflow highlights

- answer inbound call
- continue voice conversation
- send missed-call recovery SMS
- persist the call
- generate the call summary

