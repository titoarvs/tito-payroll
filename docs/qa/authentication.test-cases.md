# Authentication — QA Test Cases

## Overview

Email/password and optional Google SSO flows across `/login`, `/signup`, `/forgot-password`, and `/reset-password`.

## Prerequisites

- App running locally with Postgres migrated
- `.env.local` configured (`ADMIN_EMAILS`, `BETTER_AUTH_*`, `DATABASE_URL`)
- Google credentials optional; without them the Google button is hidden

## Test Cases

### TC-01: Sign up with email and password

- **Priority:** High
- **Preconditions:** Email is not already registered
- **Steps:**
  1. Open `/signup`
  2. Enter name, email, password (8+ chars)
  3. Submit
- **Expected result:** Account created, session established, redirected to `/`

### TC-02: Sign in with email and password

- **Priority:** High
- **Preconditions:** Existing user account
- **Steps:**
  1. Open `/login`
  2. Enter valid email and password
  3. Submit
- **Expected result:** Redirected to `/` (or `?next=` destination); audit log gains a `login` row

### TC-03: Reject invalid credentials

- **Priority:** High
- **Preconditions:** Existing user
- **Steps:**
  1. Open `/login`
  2. Enter wrong password
  3. Submit
- **Expected result:** Inline error; user remains on login page

### TC-04: Self-serve forgot password

- **Priority:** High
- **Preconditions:** Existing user; Resend optional
- **Steps:**
  1. Open `/forgot-password`
  2. Submit account email
  3. Open reset link from email or server console
  4. Set a new password on `/reset-password`
- **Expected result:** Password updated; can sign in with new password; audit shows `password_reset_requested` then `password_reset_self`

### TC-05: Google SSO (when configured)

- **Priority:** Medium
- **Preconditions:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set; redirect URI registered
- **Steps:**
  1. Open `/login`
  2. Click Continue with Google
  3. Complete Google consent
- **Expected result:** Session created; redirected home; `login` audit row present

### TC-06: Google button always visible

- **Priority:** Medium
- **Preconditions:** Google env vars may be unset
- **Steps:**
  1. Open `/login` and `/signup`
- **Expected result:** "Continue with Google" is visible. If env vars are unset, clicking it shows a configure-env message; email/password still works

### TC-07: Admin bootstrap via ADMIN_EMAILS

- **Priority:** High
- **Preconditions:** Email listed in `ADMIN_EMAILS`
- **Steps:**
  1. Sign up with that email
- **Expected result:** User role is `admin`; `/users` and `/audit` are accessible

## Edge Cases & Error States

- Empty required fields show browser/HTML validation
- Password shorter than 8 characters rejected on signup and reset
- Invalid/expired reset token shows error messaging on `/reset-password`
- Anonymous visit to `/users` redirects to `/login`

## Out of Scope

- Email verification flows
- Organization / multi-tenant auth
