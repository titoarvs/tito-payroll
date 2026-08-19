# App shell — QA Test Cases

## Overview

Signed-in home (`/dashboard`) and account settings (`/settings/profile`,
`/settings/password`). Admin overview at `/admin`.

## Prerequisites

- Running app with migrated DB
- At least one `user` account and one `admin` account

## Test Cases

### TC-01: Guest redirected from dashboard

- **Priority:** High
- **Preconditions:** Signed out
- **Steps:**
  1. Visit `/dashboard`
- **Expected result:** Redirect to `/login` (proxy and/or `requireSession`)

### TC-02: Signed-in user sees dashboard

- **Priority:** High
- **Preconditions:** Signed in as `user`
- **Steps:**
  1. Visit `/dashboard`
- **Expected result:** Welcome heading with first name; links to profile and password settings; no admin card

### TC-03: Admin sees dashboard and admin card

- **Priority:** High
- **Preconditions:** Signed in as `admin`
- **Steps:**
  1. Visit `/dashboard`
  2. Click Admin overview
- **Expected result:** Admin card visible; `/admin` shows Users and Audit links

### TC-04: Update profile name

- **Priority:** High
- **Preconditions:** Signed in
- **Steps:**
  1. Open `/settings/profile`
  2. Change display name to a valid value
  3. Submit
- **Expected result:** Success alert; name persists after refresh; sidebar shows new name

### TC-05: Profile validation — empty name

- **Priority:** Medium
- **Preconditions:** Signed in
- **Steps:**
  1. Clear the name field and submit
- **Expected result:** Browser or server validation prevents save; no success

### TC-06: Change password happy path

- **Priority:** High
- **Preconditions:** Email/password account
- **Steps:**
  1. Open `/settings/password`
  2. Enter current password and a new password (≥8 chars)
  3. Submit
  4. Sign out and sign in with the new password
- **Expected result:** Success alert; login works with new password

### TC-07: Change password — wrong current password

- **Priority:** High
- **Preconditions:** Signed in
- **Steps:**
  1. Submit with an incorrect current password
- **Expected result:** Error alert; password unchanged

### TC-08: Non-admin cannot open admin routes

- **Priority:** High
- **Preconditions:** Signed in as `user`
- **Steps:**
  1. Visit `/admin`, `/users`, `/audit`
- **Expected result:** Redirect away (typically to `/`)

## Edge Cases & Error States

- Email field on profile is read-only
- Google-only accounts may fail password change if no password credential exists

## Out of Scope

- Avatar upload (files module)
- Email change / verification
