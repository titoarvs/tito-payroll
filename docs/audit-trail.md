# Audit trail

## Purpose

Immutable-ish history of auth, admin, and commerce events for operators.

## When users encounter it

Admins open `/audit` from the admin side nav or overview.

## Routes / entry points

| Route | File |
| --- | --- |
| `/audit` | `src/app/(admin)/audit/page.tsx` |

## How writes work

1. Better Auth `hooks.after` in `src/lib/auth.ts` via `resolveAuditAction`
2. Explicit `writeAuditLog` from commerce (product create/update, order paid)

Path → action mapping (`src/lib/audit.ts`):

| Path pattern | Action |
| --- | --- |
| `/sign-in/email`, `/callback/*`, `/sign-in/social` | `login` |
| `/sign-out` | `logout` |
| `/admin/set-role` | `role_changed` |
| `/admin/set-user-password` | `password_reset_by_admin` |
| `/admin/ban-user` | `user_banned` |
| `/admin/unban-user` | `user_unbanned` |
| `/request-password-reset`, `/forget-password` | `password_reset_requested` |
| `/reset-password` | `password_reset_self` |

Also written directly: `order_paid`, `product_created`, `product_updated`.

Schema: `audit_log` in `src/db/schema/audit.ts`.

## How reads work

- Admin-only page: `requireAdmin()`
- Filters: `action`, actor email substring, pagination (`PAGE_SIZE = 20`)

## Unit check

`src/lib/audit.test.ts` — path mapping and `buildAuditEntry` (`pnpm test`).

## QA

[docs/qa/audit-trail.test-cases.md](./qa/audit-trail.test-cases.md)
