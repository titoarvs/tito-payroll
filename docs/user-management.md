# User management

## Purpose

Admins list users, open a user detail page, change roles, set passwords, and
ban/unban users.

## When users encounter it

Only when `session.user.role === "admin"` — via `/admin`, header Admin link, or
side nav.

## Routes / entry points

| Route | File |
| --- | --- |
| `/users` | `src/app/(admin)/users/page.tsx` |
| `/users/[id]` | `src/app/(admin)/users/[id]/page.tsx` |
| Layout (side nav) | `src/app/(admin)/layout.tsx` |

Components: `users-table.tsx`, `user-detail-forms.tsx`, shared `AppSidebar`.

## Server actions

File: `src/app/(admin)/users/actions.ts`

| Action | Input (Zod) | Calls | Side effects |
| --- | --- | --- | --- |
| `setUserRole` | `userId`, `role: admin \| user` | `requireAdmin()` → `auth.api.setRole` | notify target; revalidate; audit `role_changed` |
| `resetUserPassword` | `userId`, `newPassword` (min 8) | `requireAdmin()` → `auth.api.setUserPassword` | audit `password_reset_by_admin` |
| `banUser` | `userId`, optional `banReason` | `requireAdmin()` → `auth.api.banUser` | cannot ban self; audit `user_banned` via Better Auth path |
| `unbanUser` | `userId` | `requireAdmin()` → `auth.api.unbanUser` | audit `user_unbanned` |

Reads:

- List: `auth.api.listUsers`
- Detail: `auth.api.getUser({ query: { id } })`

## Auth requirements

- `(admin)` layout calls `requireAdmin()` — non-admins redirect to `/`
- Each server action calls `requireAdmin()` again
- Better Auth admin plugin also enforces admin permissions on those APIs
- Admins cannot change their own role or ban themselves in the UI

## Security notes

- Do not trust client-supplied role without Zod enum + server admin check
- Target `userId` is intentional for admin tooling; caller must be admin
- `proxy.ts` only checks cookie presence for `/users/*`

## QA

[docs/qa/user-management.test-cases.md](./qa/user-management.test-cases.md)
