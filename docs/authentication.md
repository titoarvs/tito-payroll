# Authentication

## Purpose

Sign users in and out with email/password or Google SSO, and support self-serve password reset. Admins listed in `ADMIN_EMAILS` receive `role: "admin"` on first signup.

## When users encounter it

- Landing CTAs → `/login` or `/signup`
- Protected admin routes redirect anonymous users to `/login?next=...`
- Forgot password from the login form

## Routes / entry points

| Route | File |
| --- | --- |
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/signup` | `src/app/(auth)/signup/page.tsx` |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` |
| `/api/auth/[...all]` | `src/app/api/auth/[...all]/route.ts` |

UI: `src/components/auth/*` (forms, Google button, auth shell).

## Server / auth APIs

- Config: `src/lib/auth.ts` — `betterAuth` + `drizzleAdapter` + `emailAndPassword` + optional Google `socialProviders` + `admin` plugin + `nextCookies()`
- Client: `src/lib/auth-client.ts` — `signIn`, `signUp`, `signOut`, `requestPasswordReset`, `resetPassword`, `adminClient`
- Session helpers: `getSession`, `requireSession`, `requireAdmin` in `src/lib/require-admin.ts`
- Mail: `sendResetPasswordEmail` in `src/lib/mail.ts` (Resend or console fallback)

## Auth requirements

- Login/signup/reset pages are public
- Google button is always shown; if `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are unset, click explains how to configure OAuth
- Admin bootstrap: `ADMIN_EMAILS` (comma-separated) matched case-insensitively on user create

## Side effects

- Successful login / OAuth callback → `login` audit row
- Sign-out → `logout` audit row
- Request reset → `password_reset_requested`
- Complete reset → `password_reset_self`

## Env / setup

See `.env.example`: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Google optional, Resend optional.

Google redirect URI (dev): `http://localhost:3000/api/auth/callback/google`

## Security notes

- UI hiding of admin links is not auth — `/users` and `/audit` use `requireAdmin()`
- Passwords never returned to the client; hashing is handled by Better Auth
- Reset tokens flow through Better Auth verification table

## QA

[docs/qa/authentication.test-cases.md](./qa/authentication.test-cases.md)
