# Developer Onboarding

## Architecture Rules

- Use `src/config/navigation.ts` for protected routes and dashboard navigation.
- Use `src/config/app.ts` for global app metadata and provider safety flags.
- Put shared UI in `src/components/ui`.
- Put shared layout primitives in `src/components/layout`.
- Put domain logic in `src/lib/<domain>`.
- Keep external providers behind abstraction layers.

## Demo Safety

All current modules must remain deterministic and safe:

- no real patient data
- no live SMS
- no live payment calls
- no AI provider calls

## Before Opening a Pull Request

```powershell
npm run lint
npm run build
```

## Adding New Pages

1. Add route files in `src/app`.
2. Add loading states.
3. Add protected route entries in `src/config/navigation.ts`.
4. Reuse existing shell/components where practical.
5. Update docs or session summary if architecture changes.

