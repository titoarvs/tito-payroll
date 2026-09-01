# Auth QA cases

## Happy path

1. With HRIS API running and a known user, open `/sign-in`.
2. Enter email + password → redirect to `/dashboard`.
3. Dashboard shell loads; profile is available via topnav avatar (from `GET /users/me`).
4. Open avatar menu → Sign out → tokens cleared → redirect to `/sign-in`.

## Google SSO

1. API `PAYROLL_FRONTEND_URL` is `http://localhost:3002` (or payroll origin is in `CORS_ORIGINS`).
2. Google Cloud Authorized redirect URI includes `http://localhost:8000/api/auth/google/callback`.
3. Click Continue with Google → Google account picker → `/auth/success` → `/dashboard`.
4. MFA-enabled Google user → `/auth/verify-mfa` → valid code → `/dashboard`.
5. Failed Google login → `/sign-in?error=google_login_failed` with inline error; no tokens stored.
6. Starting SSO from payroll must land back on payroll (`:3002`), not T201 (`:3000`).

## MFA

1. Sign in with an MFA-enabled user (password or Google).
2. Password MFA: code field appears on `/sign-in`. Google MFA: `/auth/verify-mfa`.
3. Valid code → `/dashboard`.
4. Invalid code → inline error; stay on MFA step.
5. Back (password MFA) or Return to sign in (Google MFA) returns to `/sign-in`.

## Password visibility

1. On `/sign-in`, type into Password (dots/asterisks).
2. Click **Show password** → characters are visible; label becomes **Hide password**.
3. Click **Hide password** → masked again.
4. Sign in still submits the same password (visibility does not change the value).

## Auth boundaries

1. Visit `/` or `/dashboard` with no tokens → redirect to `/sign-in`.
2. Visit `/sign-in` while already signed in → redirect to `/dashboard`.
3. Wrong password → error message; no tokens stored.
4. Expired session on `/users/me` after failed refresh → cleared tokens; re-auth required.
5. `/auth/success` without tokens → error + link back to sign in; no session.

## CORS / env

1. Payroll on `http://localhost:3002` can call `http://localhost:8000/api`.
2. Missing `VITE_HRIS_API_BASE_URL` still defaults to `http://localhost:8000/api`.
3. OAuth `returnTo` for an unknown origin with `client=payroll` lands on `PAYROLL_FRONTEND_URL`, not T201.
