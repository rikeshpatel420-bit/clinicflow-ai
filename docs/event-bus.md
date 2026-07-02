# Event Bus

The Flow Platform event bus is the shared communication layer between modules.

## Typical events

- `call.completed`
- `call.missed`
- `lead.created`
- `booking.requested`
- `quote.requested`
- `payment.received`
- `customer.created`
- `workflow.completed`
- `notification.sent`
- `timeline.recorded`
- `audit.recorded`

## Why it exists

- Decouples workflows from notifications and audit logging
- Lets modules react without direct imports
- Makes profile-driven behaviour easier to extend

