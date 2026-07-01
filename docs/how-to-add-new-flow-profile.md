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
3. Wrap the profile with `defineFlowPlatformProfile()`
4. Export the profile from `src/lib/flow-platform/registry.ts`
5. Set `FLOW_PLATFORM_PROFILE_ID=<profile-id>` when you want the runtime to use it

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

## Good practice

- Keep the core engine generic.
- Put all domain wording in the profile.
- Keep workflows declarative.
- Prefer short prompts and concise follow-up questions.
- Reuse the shared conversation engine instead of creating custom parsers.

