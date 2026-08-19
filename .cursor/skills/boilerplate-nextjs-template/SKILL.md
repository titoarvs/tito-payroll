---
name: boilerplate-nextjs-template
description: >-
  Project conventions for this Next.js boilerplate (Better Auth, Drizzle,
  Postgres, admin roles, audit trail). Use when working in this repo on auth,
  users, audit, env, migrations, proxy, or landing role-gated UI.
---

# Next.js Boilerplate — project skill

## Stack

- Next.js 16 App Router (`src/app`), React 19, Tailwind 4
- Better Auth (`src/lib/auth.ts`) + `admin` plugin + `nextCookies()` last
- Drizzle ORM + Postgres (`src/db`, `docker-compose.yml`)
- Zod for env (`src/lib/env.ts`) and server action inputs
- Resend optional (`src/lib/mail.ts`); console fallback when unset
- No React Query by default

## Auth & roles

- Roles: `user` (default), `admin` (via `ADMIN_EMAILS` on signup or admin set-role)
- Guards: `getSession`, `requireSession`, `requireAdmin` in `src/lib/require-admin.ts`
- Client: `src/lib/auth-client.ts` (email, Google, reset password, admin client)
- Catch-all API: `src/app/api/auth/[...all]/route.ts`
- Optimistic cookie gate: `src/proxy.ts` for `/users` and `/audit` only

## Admin surfaces

- Side nav layout: `src/app/(admin)/layout.tsx`
- Overview: `/admin`
- Users list: `/users` → detail `/users/[id]`
- Mutations: `setUserRole`, `resetUserPassword`, `banUser`, `unbanUser` in `users/actions.ts`
- Audit: `/audit` reads `audit_log` via Drizzle; writes come from Better Auth hooks + commerce
- Products / orders / analytics under `/admin/*`

## Audit events

Mapped in `resolveAuditAction` (`src/lib/audit.ts`): login, logout, role_changed, password resets, user_banned, user_unbanned. Explicit writes: order_paid, product_created, product_updated.

## Landing authorization (UX)

- Guest / admin / user CTAs differ on `src/app/page.tsx` and `SiteHeaderNav`
- Hiding links is not enough — admin routes still use `requireAdmin()`

## Env

See `.env.example`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAILS`. Optional: Google OAuth, Resend.

## When changing features

Follow the **feature-workflow** skill: security → code → `docs/` → `docs/qa/` → `pnpm verify`.
