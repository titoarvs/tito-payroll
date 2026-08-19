# Landing & role-gated UI

## Purpose

Public marketing/landing page for the template, with CTAs and header nav that change by auth state and role. This is **UX authorization only** — real enforcement lives on admin routes and server actions.

## When users encounter it

Anyone hitting `/`.

## Routes / entry points

| Route | File |
| --- | --- |
| `/` | `src/app/page.tsx` |
| Header nav | `src/components/site-header-nav.tsx` |

## Behavior by role

| State | Header | Hero CTAs | Quickstart CTA |
| --- | --- | --- | --- |
| Guest | Sign in / Get started | Create account / Sign in | Spin up an account |
| User (`role !== admin`) | Hello / Dashboard / Log out | Open dashboard | Hidden |
| Admin | Hello / Dashboard / Admin / Log out | Open dashboard / Admin overview | Open admin overview |

## Auth requirements

- Page uses `getSession()` (optional session) — no redirect for guests
- Admin destinations still protected by `requireAdmin()` and `proxy.ts`

## Security notes

- Never expose `/users` or `/audit` data on the landing page for non-admins
- Hiding “View audit trail” for users does not replace server checks

## Related

- [Architecture](./architecture.md)
- [Authentication](./authentication.md)
- [User management](./user-management.md)
