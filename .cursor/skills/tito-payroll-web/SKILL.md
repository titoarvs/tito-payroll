---
name: tito-payroll-web
description: >-
  Generates Tito Payroll as a TanStack Start web-only app that talks to
  tito-hris-api. Use when writing payroll UI, routes, hooks, api-services,
  queries, auth against HRIS, or when the user mentions tito-payroll, TanStack
  Start, payroll frontend, or replacing the Next.js boilerplate.
---

# Tito Payroll — TanStack Start web only

`tito-payroll` is the payroll **frontend**. `tito-hris-api` is the **only** backend for domain data and auth.

The tree is TanStack Start (`src/routes/`). **Do not add Next.js.** Domain data and auth live in `tito-hris-api`.

## Stack (generate this, not Next.js)

- TanStack Start + TanStack Router file routes (`src/routes/`)
- TanStack Query
- Vite, React 19, Tailwind 4, `~/` alias
- Zod + react-hook-form on forms
- sonner toasts, Radix/shadcn in `src/components/ui/`
- HRIS JWT client (`src/lib/hris-api-client.ts`) — copy `T201/src/lib/hris-api-client.ts`, storage keys `payroll.hris.*`

## Layer flow (never skip)

```
Routes → Components → Hooks → Queries → api-services → tito-hris-api
```

| Layer | Path | Does | Must not |
|-------|------|------|----------|
| Routes | `src/routes/` | URL, layout, `beforeLoad` auth, loaders | HTTP, business rules |
| Components | `src/components/` | UI from props/hooks | `useQuery` / `hrisApi` / toasts |
| Hooks | `src/hooks/` | Query/mutation, toast, invalidation | JSX, route paths as business rules |
| Queries | `src/queries/` | `queryOptions` + query keys | React hooks, toasts |
| Services | `src/api-services/` | HTTP via `hrisApi`, types, mappers | React, cache, toasts |

## Do not generate

- Next.js App Router (`src/app/`), Route Handlers, `page.tsx`, `layout.tsx` in the App Router sense
- Server actions (`"use server"`)
- `createServerFn` as the payroll backend (no local domain server fns)
- Local Drizzle / Postgres for payroll or employee tables
- Better Auth as payroll identity (HRIS JWT only)
- Axios class client — use the T201 `hrisApi` object
- UI tests (`*.test.tsx`, Playwright, RTL)

## Auth

- Tokens from `tito-hris-api` `/auth/*`
- `beforeLoad` redirects when there is no HRIS session
- UI role/permission hiding is UX only — API `@Permissions` is the security boundary
- Copy session helpers from `T201/src/lib/hris-auth.ts` as needed; do not invent a second auth system

## Data fetching

Always add all three for new server data:

1. **Service** — functions on `hrisApi` (`get` / `post` / `patch` / `delete`)
2. **Query** — `queryOptions({ queryKey, queryFn })`
3. **Hook** — `useQuery` / `useMutation` with invalidation + toast

Follow **payroll-api-hooks** for file names and templates.

Route `loader` may `queryClient.ensureQueryData(...)` using the same query options. Routes still do not call `hrisApi` directly.

## Forms & UX

- Never disable submit for validation errors
- `disabled={mutation.isPending}` + label change only
- Inline `FormMessage`; toasts for mutation success/error
- Deletes: AlertDialog
- Tailwind semantic tokens (`bg-background`, `text-foreground`) — both light and dark

## Money

API money is decimal/`numeric`. Web types: `string`. Format for display; never use IEEE `number` for pay amounts.

## Feature docs

Same-change: `docs/<feature>.md` + `docs/qa/<feature>.test-cases.md`. See **feature-workflow**.

## Sibling API

Non-UI contract work belongs in `../tito-hris-api` `src/payroll/` in the same task. Follow **payroll-hris-sync**.

## File placement

See [reference.md](reference.md).
