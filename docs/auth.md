# Auth (HRIS JWT)

Payroll has no local identity store. Sign-in uses `tito-hris-api` users in the
`auth` schema (same accounts as T201).

## Flow

### Email / password

1. Browser posts credentials to `POST /api/auth/login`.
2. Tokens are stored under `payroll.hris.*` in `localStorage`.
3. Protected routes call `GET /api/users/me` with the access token.
4. Logout calls `POST /api/auth/logout` and clears local tokens.

### Google SSO (OAuth redirect)

Same path as T201. GIS ID-token popup is not used.

1. Sign-in sends the browser to `GET /api/auth/google?returnTo={origin}`.
2. Nest starts Google OAuth and stashes `returnTo` in OAuth `state` (allowlisted).
3. Google callback redirects to:
   - `{origin}/auth/success?accessToken&refreshToken`, or
   - `{origin}/auth/verify-mfa?mfaToken=...` when MFA is required, or
   - `{origin}/sign-in?error=google_login_failed` on failure.
4. `/auth/success` stores the token pair and loads `GET /users/me`.

`returnTo` must match `PAYROLL_FRONTEND_URL` (default `http://localhost:3002`),
`FRONTEND_URL`, `T201_FRONTEND_URL`, or `CORS_ORIGINS`. Anything else falls back
to `FRONTEND_URL` (usually T201).

Google Cloud: Authorized **redirect URI** is the API callback
(`http://localhost:8000/api/auth/google/callback`), not the payroll origin.

## Files

| Path | Role |
| --- | --- |
| `src/lib/hris-api-client.ts` | Fetch client, token storage, refresh |
| `src/lib/hris-auth.ts` | `loginWithPassword`, `verifyMfa`, `getCurrentHrisUser`, `getGoogleSignInUrl`, `parseTokensFromUrl`, `logoutFromHris` |
| `src/queries/current-user.ts` | Query options for `/users/me` |
| `src/hooks/use-current-user.ts` | `useCurrentUser`, `useLogout` |
| `src/routes/sign-in.tsx` | Google redirect + email/password (+ MFA on same page) |
| `src/routes/auth/success.tsx` | Stores OAuth tokens, then `/` |
| `src/routes/auth/verify-mfa.tsx` | MFA after Google redirect |
| `src/routes/index.tsx` | Protected home; shows current user |

## Env

```bash
VITE_HRIS_API_BASE_URL=http://localhost:8000/api
```

API must allow origin `http://localhost:3002` via `PAYROLL_FRONTEND_URL` (or
`CORS_ORIGINS`) so OAuth can return here.
