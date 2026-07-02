# Product Marketplace

The marketplace is the profile catalog that makes new Flow products activatable without rewriting core code.

## Inheritance model

- Shared platform services stay the same
- Each product swaps only profile configuration
- The active profile is selected through `FLOW_PLATFORM_PROFILE_ID`

## Marketplace metadata

Each product should expose:

- brand
- industry
- voice profile
- intents
- entities
- workflows
- templates
- dashboard labels
- activation state

## Current products

- ClinicFlow
- PlumbFlow
- SparkFlow
- HeatFlow
- BuildFlow
- EstateFlow
- VetFlow

## Activation rules

- `active` means the runtime profile is currently selected
- `available` means the profile validates and can be switched on
- `attention` means the profile is missing required configuration

## Operator route

Use `/platform/profiles` to compare products and `/saas` to see the commercial activation view.
