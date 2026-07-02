# Calendar Abstraction

The calendar abstraction keeps booking logic provider-neutral.

## Supported configuration

- manual booking
- Google Calendar
- Microsoft 365 Calendar
- practice-management calendar
- receptionist-managed callback queues

## Responsibilities

- describe the booking behaviour
- define the provider choice
- capture appointment preferences
- keep follow-up behaviour consistent

## Why it exists

Different Flow products may use different scheduling providers, but the workflow engine should not care which one is underneath.

## Practical rule

If a provider is unavailable, the platform should keep the request in a booking queue and let the team confirm manually.

