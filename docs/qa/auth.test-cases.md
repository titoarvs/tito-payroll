# Auth QA cases

## Happy path

1. With HRIS API running and a known user, open `/sign-in`.
2. Enter email + password → redirect to `/`.
3. Home shows name, email, and roles from `GET /users/me`.
4. Click Sign out → tokens cleared → redirect to `/sign-in`.

## Google SSO

1. `VITE_GOOGLE_CLIENT_ID` set; `http://localhost:3002` is an Authorized JavaScript origin.
2. Click Continue with Google → GIS prompt → success → `/` with profile.
3. MFA-enabled Google user → MFA step on the same page → verify → `/`.
4. Cancel / block GIS prompt → inline error; no tokens stored.
5. Missing `VITE_GOOGLE_CLIENT_ID` → clear config error on click.

## MFA

1. Sign in with an MFA-enabled user (password or Google).
2. MFA code field appears on the same page.
3. Valid code → `/` with user profile.
4. Invalid code → inline error; stay on MFA step.
5. Back cancels MFA and returns to email/password / Google.

## Auth boundaries

1. Visit `/` with no tokens → redirect to `/sign-in`.
2. Visit `/sign-in` while already signed in → redirect to `/`.
3. Wrong password → error message; no tokens stored.
4. Expired session on `/users/me` after failed refresh → cleared tokens; re-auth required.

## CORS / env

1. Payroll on `http://localhost:3002` can call `http://localhost:8000/api`.
2. Missing `VITE_HRIS_API_BASE_URL` still defaults to `http://localhost:8000/api`.
3. CSP allows `https://accounts.google.com` scripts/frames for GIS.
