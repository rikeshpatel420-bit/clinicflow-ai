# How to Add a New Flow Profile

Flow Platform is profile-driven. To add a new product, create a configuration folder and register it.

## Steps

1. Create `src/lib/flow-platform/profiles/<new-profile>.ts`
2. Define:
   - `industry`
   - `clinic`
   - `conversation.leads`
   - `conversation.voice`
   - `dashboard`
   - `knowledgeBase`
   - `notifications`
   - `workflows`
   - optional template overrides
3. Prefer the shared helpers in `src/lib/flow-platform/profile-builder.ts`
4. Wrap the profile with `createFlowPlatformProfile()` or `defineFlowPlatformProfile()`
5. Export the profile from `src/lib/flow-platform/registry.ts`
6. Add the profile to the `/platform` catalog if you want it visible in the UI
7. Set `FLOW_PLATFORM_PROFILE_ID=<profile-id>` when you want the runtime to use it
8. Use `/factory` if you want the same blueprint captured as a generated configuration package, route plan, docs bundle, and smoke test
9. Reuse the shared notification, audit, timeline, event, and customer helpers rather than inventing product-specific services
10. Open `/platform/profiles` to verify the new profile passes the internal validator before considering it production-ready
11. Open `/platform/foundation` to confirm the shared SaaS layer is still healthy and nothing about the profile requires a platform rewrite

## Profile checklist

Each profile should provide:

- industry name and terminology
- brand colours and logo text
- voice personality and SSML settings
- greeting, closing, fallback, and emergency prompts
- intent definitions and follow-up questions
- entity extraction rules
- recovery and escalation rules
- summary templates
- SMS and email templates
- dashboard labels and icons
- workflow triggers, steps, actions, fallback rules, and audit trail settings
- notification templates and profile-aware overrides
- reusable customer 360 fields
- timeline-friendly audit metadata
- Flow Factory defaults for navigation, workflow blueprints, and sample automation rules
- validator coverage for voice, templates, workflows, branding, prompts, navigation, notification rules, emergency rules, booking rules, and AI configuration

## Good practice

- Keep the core engine generic.
- Put all domain wording in the profile.
- Keep workflows declarative.
- Use triggers, conditions, steps, and actions instead of hard-coding branch logic.
- Prefer short prompts and concise follow-up questions.
- Reuse the shared conversation engine instead of creating custom parsers.
- Reuse the shared notification engine and event bus for transport and cross-module communication.
- Add a profile page under `/platform/profiles/[profileId]` if you want a browseable internal preview.
- Reuse the standard contact entity helpers before adding one-off entity patterns.
- Keep the Flow Factory output as the source of truth for the new product blueprint so future profiles stay config-driven.
- For a real customer workspace, use the onboarding engine so the clinic or business instance is created from the same configuration layer before it is marked ready.
