---
name: feature-workflow
description: >-
  End-to-end feature workflow for this Next.js template: implement App Router
  pages/server actions with server-side auth, update docs/, add QA test cases,
  then run typecheck, lint, test, and build. Use when adding or changing
  features, routes, auth, roles, audit, landing CTAs, or admin UI. Enforces
  feature-docs, feature-security, feature-testing, and feature-completion.
---

# Feature workflow (this repo)

Apply this skill whenever you add or change user-facing behavior in this template.

## Read first

1. [docs/architecture.md](../../../docs/architecture.md) — layers and auth model
2. Matching feature doc under `docs/` if one exists
3. Project rules: `.cursor/rules/feature-docs.mdc`, `feature-security.mdc`, `feature-testing.mdc`, `feature-completion.mdc`

## Implementation order

1. **Trace the real path** — page → server action / `auth.api` → Drizzle / Better Auth hooks.
2. **Security first** — call `requireSession` or `requireAdmin` on every sensitive page and server action. Validate inputs with Zod. Treat `proxy.ts` as UX redirect only.
3. **UI role-gating is not auth** — hide admin CTAs for users (and guest CTAs when signed in), but never skip the server guard.
4. **Docs in the same change** — update or add `docs/<feature>.md` with real paths and function names.
5. **QA in the same change** — add/update `docs/qa/<feature>.test-cases.md` covering happy path, validation, auth boundaries, and edge cases.
6. **One small check** for non-trivial logic (prefer `node:test` next to the pure helper, like `src/lib/audit.test.ts`).
7. **Verify before done** — run the completion gate below and fix every failure.

## Completion gate (required)

Do not stop after code-only changes. Always:

1. Update feature docs (`docs/*.md`)
2. Update QA cases (`docs/qa/*.test-cases.md`)
3. Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

Or the shortcut: `pnpm verify`

If typecheck, lint, or build fails, fix it in this change. Do not hand back a broken tree.

## Project conventions

| Concern | Where |
| --- | --- |
| Pages / layouts | `src/app/` |
| Server actions | colocated `actions.ts` under the route segment |
| Auth config + audit hooks | `src/lib/auth.ts` |
| Session guards | `src/lib/require-admin.ts` |
| Schema | `src/db/schema/` |
| Feature docs | `docs/*.md` |
| QA cases | `docs/qa/*.test-cases.md` |

## Do not

- Invent `src/fn` or `src/data-access` folders — this app uses App Router + `lib/` + server actions.
- Add React Query unless the user explicitly needs client cache/polling/infinite scroll.
- Ship admin mutations without `requireAdmin()` + Zod.
- Finish a feature without docs, QA updates, and a clean `pnpm verify`.
