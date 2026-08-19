# App shell — signed-in home and settings

## Purpose

Gives every signed-in user a home (`/dashboard`) and account settings
(`/settings/profile`, `/settings/password`), separate from the admin-only
shell under `(admin)`.

## Routes

| Route | Guard | File |
| --- | --- | --- |
| `/dashboard` | `requireSession` | `src/app/(app)/dashboard/page.tsx` |
| `/settings/profile` | `requireSession` | `src/app/(app)/settings/profile/page.tsx` |
| `/settings/password` | `requireSession` | `src/app/(app)/settings/password/page.tsx` |
| `/admin` | `requireAdmin` | `src/app/(admin)/admin/page.tsx` |

Layouts:

- `src/app/(app)/layout.tsx` — `requireSession` + `AppSidebar`
- `src/app/(admin)/layout.tsx` — `requireAdmin` + `AppSidebar` (users, audit)

Shared sidebar: `src/components/shell/app-sidebar.tsx` (takes `navItems` + `sectionLabel`).

## Server actions

`src/features/account/actions.ts`:

- `updateProfile` — `requireSession`, Zod name, then `auth.api.updateUser`
- `changePassword` — `requireSession`, Zod passwords, then `auth.api.changePassword`

## Proxy

`src/proxy.ts` adds optimistic cookie redirects for `/dashboard`, `/settings`,
`/admin` (plus existing `/users`, `/audit`). Real auth still happens in the
layout guards.

## Removing this module

1. Delete `src/app/(app)/`, `src/features/account/`, `src/components/shell/`
2. Drop `/dashboard`, `/settings`, `/admin` from `src/proxy.ts`
3. Point landing CTAs back to `/users` for admins
4. Delete this doc and `docs/qa/app-shell.test-cases.md`
