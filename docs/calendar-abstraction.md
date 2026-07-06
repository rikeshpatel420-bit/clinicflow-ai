# Calendar Abstraction

The calendar abstraction keeps booking logic provider-neutral.

## Supported providers

- Dentally
- Software of Excellence
- Exact
- Google Calendar
- Microsoft Outlook

## Common API

Every connector exposes the same operations:

- `getAvailability()`
- `createBooking()`
- `updateBooking()`
- `cancelBooking()`

## Responsibilities

- describe the booking behaviour
- define the provider choice
- capture appointment preferences
- keep follow-up behaviour consistent
- keep the booking queue usable when a connector is mocked or unavailable

## Why it exists

Different Flow products may use different scheduling providers, but the workflow engine should not care which one is underneath. The application can switch from practice-management sync to calendar-only scheduling without changing the booking flow.

## Practical rule

If a provider is unavailable, the platform keeps the request in the booking queue, writes the appointment record safely, and lets the team confirm manually.
