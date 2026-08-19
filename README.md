# Next.js Boilerplate

A complete-but-deletable Next.js base app: landing page, Better Auth (Google SSO +
email/password), signed-in app shell, admin roles, password reset, audit trail,
S3 uploads, Stripe shop, notifications, and analytics — on Drizzle ORM and Postgres.

No client-side data-fetching library. Server Components and Server Actions are the default.

## Stack

| Piece | Version (pinned at create time) |
| --- | --- |
| Next.js | 16.3 |
| React | 19.2 |
| Better Auth | 1.6 (admin plugin) |
| Drizzle ORM | 0.45 |
| Postgres | 17 (Docker) |
| Tailwind CSS | 4.3 |
| Zod | 4.4 |
| Resend | 6.x (optional) |
| Stripe | 22.x (optional) |
| AWS S3 SDK | 3.x (optional) |

## Modules (delete what you do not need)

| Module | Routes | Docs |
| --- | --- | --- |
| App shell | `/dashboard`, `/settings/*` | [docs/app-shell.md](docs/app-shell.md) |
| Admin | `/admin`, `/users`, `/audit` | [docs/user-management.md](docs/user-management.md) |
| Files | avatar uploads | [docs/files.md](docs/files.md) |
| Commerce | `/shop`, `/cart`, `/orders`, `/admin/products` | [docs/commerce.md](docs/commerce.md) |
| Notifications | `/notifications` | [docs/notifications.md](docs/notifications.md) |
| Analytics | `/admin/analytics`, `/api/events`, GA4 | [docs/analytics.md](docs/analytics.md) |

Each feature doc ends with a **Removing this module** checklist.

## Get your own copy

**GitHub template (preferred)**

1. Click **Use this template** on the repository page
2. Clone your new repo
3. Continue with [Quick start](#quick-start)

**Clone**

```bash
git clone https://github.com/Tito-Solutions/boilerplate-nextjs-template.git my-app
cd my-app
git remote remove origin
# Optionally: rm -rf .git && git init
```

## Prerequisites

- Node.js 20+ (verified on 24.13)
- pnpm 11+
- Docker (for local Postgres on host port **5433** — avoids clashing with a native Postgres on 5432)

## Quick start

```bash
pnpm install
cp .env.example .env.local
npx @better-auth/cli secret
# Paste the secret into BETTER_AUTH_SECRET in .env.local
# Set ADMIN_EMAILS to the email you will sign up with

docker compose up -d
pnpm db:migrate
pnpm db:seed   # optional sample products + analytics events
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign up with an address listed in `ADMIN_EMAILS`, then open `/dashboard` and `/admin`.

## Google OAuth setup

1. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Application type: Web application
3. Authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://your-domain.com/api/auth/callback/google`
4. Put the client ID and secret in `.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
5. Restart `pnpm dev`

Until those are set, the Google button still appears on login/signup and explains how to configure OAuth when clicked. Email/password works either way.

## Stripe (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Put the webhook signing secret in STRIPE_WEBHOOK_SECRET
```

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit checks under `src/**/*.test.ts` |
| `pnpm verify` | typecheck + lint + test + build (required after feature work) |
| `pnpm db:generate` | Generate SQL from Drizzle schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema (dev only — never production) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:seed` | Sample products + analytics events |
| `pnpm auth:generate` | Regenerate Better Auth Drizzle schema |

## Project structure

```
src/
  app/
    (auth)/          # login, signup, forgot/reset password
    (app)/           # signed-in: dashboard, shop, cart, orders, settings, notifications
    (admin)/         # admin: /admin, /users, /audit, products, orders, analytics
    api/auth/        # Better Auth handler
    api/stripe/      # Stripe webhook
    api/events/      # analytics ingest
  features/          # account, files, commerce, notifications, analytics
  components/        # UI + shell + analytics
  db/schema/         # auth, audit, file, commerce, notification, analytics
  lib/               # auth, env, mail, storage, stripe, notify, analytics
proxy.ts             # Next.js 16 optimistic auth redirect
drizzle/             # SQL migrations
docs/qa/             # QA test cases
```

## Environment variables

See [`.env.example`](.env.example) for the source of truth.

**Required:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAILS`

**Optional:** Google OAuth, Resend, S3_*, Stripe, `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Without Resend, password-reset / notification emails are printed to the server console — fine for local development, not for production.

## Database workflow

1. Edit `src/db/schema/*`
2. `pnpm db:generate` — review the SQL under `drizzle/`
3. `pnpm db:migrate`
4. Commit the migration files

Use `db:push` only for throwaway local experiments. Production always uses migrations.

## Data fetching

Default: Server Components for reads, Server Actions for mutations, `revalidatePath` / router refresh after writes. Session on the client comes from Better Auth's `useSession`.

React Query is **not** included. Add it when you need polling, infinite scroll, or shared client caches.

## Roles and audit trail

- Default role: `user`
- Emails in `ADMIN_EMAILS` become `admin` on first sign-up
- Admins manage users at `/users` and read events at `/audit`
- Captured actions include login/logout, role changes, password resets, bans, product/order events

## Production build checklist

- [ ] Fresh `BETTER_AUTH_SECRET` (never the local value)
- [ ] `BETTER_AUTH_URL` is the real HTTPS origin; Google callback URI updated
- [ ] `DATABASE_URL` points at managed Postgres with `sslmode=require`
- [ ] `pnpm db:migrate` against production (not `db:push`)
- [ ] `RESEND_API_KEY` set with a verified sending domain
- [ ] Stripe live keys + webhook endpoint configured
- [ ] S3 bucket CORS allows browser PUTs from your origin
- [ ] `ADMIN_EMAILS` narrowed to real admins
- [ ] `pnpm build`, `pnpm lint`, and `pnpm test` clean
- [ ] Session cookies confirmed `Secure` / `httpOnly` over HTTPS
- [ ] Rate limiting considered for auth endpoints
- [ ] Secrets injected by the host; `.env.local` not deployed from the repo
- [ ] Retention/backup decision recorded for `audit_log` and `analytics_event`

## Deployment notes

- `src/proxy.ts` runs on the **Node** runtime (Next.js 16 `proxy` convention), not Edge
- Prefer a Node-capable host (Node server / container). Confirm your platform supports `proxy.ts`
- Append `?sslmode=require` (or equivalent) for managed Postgres

## QA

Manual test cases live in [`docs/qa/`](docs/qa/).

Feature and architecture docs live in [`docs/`](docs/) — start at [`docs/README.md`](docs/README.md).
