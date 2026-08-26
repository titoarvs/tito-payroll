---
name: feature-workflow
description: >-
  End-to-end feature workflow for Tito Payroll (TanStack Start web +
  tito-hris-api): implement Nest payroll endpoints if needed, generate
  api-services/queries/hooks, add routes/components, update docs/, add QA
  cases, then typecheck. Use when adding or changing payroll features, routes,
  HRIS contracts, pay UI, or auth against the HRIS API.
---

# Feature workflow (tito-payroll)

Apply this skill whenever you add or change user-facing payroll behavior.

Payroll web is TanStack Start only. Domain writes go to `../tito-hris-api`. Follow **tito-payroll-web**, **payroll-api-hooks**, and **payroll-hris-sync** in the same task.

## Read first

1. Matching feature doc under `docs/` if one exists
2. Nest controller/DTOs for the resource (`tito-hris-api/src/payroll/`)
3. A similar existing web resource (T201 queries/hooks or time-tracker-web `api-services`) if payroll has no pair yet

## Implementation order

1. **Trace the real path** — route → hook → query → api-service → Nest controller → service → repository.
2. **API contract first** when the endpoint is missing or changing (`add-nest-feature` under `src/payroll/`, permissions + seed).
3. **Web codegen** — types, service, queries, hooks (payroll-api-hooks). Then components and file routes.
4. **Auth** — `beforeLoad` session check; never treat UI hiding as authorization.
5. **Docs in the same change** — `docs/<feature>.md` with real paths and function names.
6. **QA in the same change** — `docs/qa/<feature>.test-cases.md` (happy path, validation, auth boundaries, money/edge cases).
7. **One small check** for non-trivial pure logic (mappers, money formatting) — `*.test.ts` next to the helper. No UI tests.
8. **Verify** — run the completion gate below.

## Completion gate (required)

1. Update feature docs (`docs/*.md`)
2. Update QA cases (`docs/qa/*.test-cases.md`)
3. API + web both updated when the contract changed
4. Run from `tito-payroll/`:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

If typecheck, lint, or build fails, fix it in this change.

## Project conventions

| Concern | Where |
| --- | --- |
| Routes / layouts | `src/routes/` |
| Feature UI | `src/components/<feature>/` |
| Hooks | `src/hooks/use-<feature>.ts` |
| Query options | `src/queries/<feature>.ts` |
| HTTP | `src/api-services/<feature>.service.ts` |
| Auth client | `src/lib/hris-api-client.ts`, `src/lib/hris-auth.ts` |
| Nest payroll | `../tito-hris-api/src/payroll/` |
| Feature docs | `docs/*.md` |
| QA cases | `docs/qa/*.test-cases.md` |

## Do not

- Add App Router pages, server actions, or local Drizzle for payroll data.
- Call `hrisApi` from components.
- Ship without docs, QA updates, and a clean typecheck.
- Add `*.test.tsx` / E2E suites.
