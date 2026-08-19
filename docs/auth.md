# Auth (HRIS JWT)

Payroll has no local identity store. Sign-in uses `tito-hris-api` users in the
`auth` schema (same accounts as T201).

## Flow

### Email / password

1. Browser posts credentials to `POST /api/auth/login`.
2. Tokens are stored under `payroll.hris.*` in `localStorage`.
3. Protected routes call `GET /api/users/me` with the access token.
4. Logout calls `POST /api/auth/logout` and clears local tokens.

### Google SSO (GIS ID token)

1. Browser loads Google Identity Services and prompts for an ID token.
2. Browser posts `{ idToken }` to `POST /api/auth/google` (Nest verifies audience).
3. Same token storage / `/users/me` / MFA path as password login.

OAuth **redirect** (`GET /api/auth/google`) is not used here — that callback returns to
`FRONTEND_URL` (usually T201). Payroll uses the SPA ID-token path so both apps can SSO.

## Files

| Path | Role |
| --- | --- |
| `src/lib/hris-api-client.ts` | Fetch client, token storage, refresh |
| `src/lib/hris-auth.ts` | `loginWithPassword`, `loginWithGoogle`, `verifyMfa`, `getCurrentHrisUser`, `logoutFromHris` |
| `src/lib/google-identity.ts` | GIS script + `requestGoogleIdToken` |
| `src/queries/current-user.ts` | Query options for `/users/me` |
| `src/hooks/use-current-user.ts` | `useCurrentUser`, `useLogout` |
| `src/routes/sign-in.tsx` | Google + email/password (+ MFA on same page) |
| `src/routes/index.tsx` | Protected home; shows current user |

## Env

```bash
VITE_HRIS_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=<same web client id as tito-hris-api GOOGLE_CLIENT_ID>
```

In Google Cloud Console, add `http://localhost:3002` under **Authorized JavaScript origins**
for that OAuth client.

API must allow origin `http://localhost:3002` via `PAYROLL_FRONTEND_URL` (or
`CORS_ORIGINS`).
