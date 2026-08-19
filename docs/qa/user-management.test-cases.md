# User Management — QA Test Cases

## Overview

Admin user management at `/users` (list) and `/users/[id]` (detail: change role, reset password). Admin chrome uses a left side nav.

## Prerequisites

- Signed in as a user with `role = admin`
- At least one non-admin user exists

## Test Cases

### TC-01: List users

- **Priority:** High
- **Preconditions:** Admin session
- **Steps:**
  1. Open `/users` from the side nav
- **Expected result:** Table shows name, email, role, joined date; each row links to `/users/[id]`

### TC-02: Open user detail

- **Priority:** High
- **Preconditions:** Admin session; at least one user in the list
- **Steps:**
  1. Click a user name or Open →
- **Expected result:** Detail page shows profile summary, role form, password reset form, and ban form

### TC-03: Change role from user to admin

- **Priority:** High
- **Preconditions:** On `/users/[id]` for a `user` role account
- **Steps:**
  1. Set role to `admin`
  2. Save role
- **Expected result:** Success message; role persists after refresh; audit trail has `role_changed`

### TC-04: Change role from admin to user

- **Priority:** High
- **Preconditions:** Another admin exists (do not demote the only admin if that would lock you out)
- **Steps:**
  1. On that user's detail page, set role to `user` and save
- **Expected result:** Role updated; audit row written

### TC-05: Cannot change own role via UI

- **Priority:** Medium
- **Preconditions:** Admin opens their own `/users/[id]` page
- **Steps:**
  1. Inspect the role form
- **Expected result:** Role select is disabled; helper text explains why

### TC-06: Admin-triggered password reset

- **Priority:** High
- **Preconditions:** On a user detail page
- **Steps:**
  1. Enter a new password (8+ chars)
  2. Submit Reset password
- **Expected result:** Success message; target can sign in with the new password; audit shows `password_reset_by_admin`

### TC-07: Reject short admin reset password

- **Priority:** Medium
- **Preconditions:** On a user detail page
- **Steps:**
  1. Enter fewer than 8 characters
- **Expected result:** Submit disabled or validation error; password unchanged

### TC-08: Unknown user id

- **Priority:** Medium
- **Preconditions:** Admin session
- **Steps:**
  1. Navigate to `/users/does-not-exist`
- **Expected result:** Not-found state with link back to `/users`

### TC-09: Non-admin cannot access users routes

- **Priority:** High
- **Preconditions:** Signed in as `user` role
- **Steps:**
  1. Navigate to `/users` and `/users/[id]`
- **Expected result:** Redirected away; no user data exposed

### TC-10: Side nav navigation

- **Priority:** Medium
- **Preconditions:** Admin session on desktop and mobile widths
- **Steps:**
  1. Use Users and Audit links in the side nav
  2. On mobile, open Menu, navigate, confirm overlay closes
- **Expected result:** Active route highlighted; pages load; mobile menu toggles correctly

### TC-11: Ban user

- **Priority:** High
- **Preconditions:** Admin on another user’s detail page
- **Steps:**
  1. Optionally enter a ban reason
  2. Click Ban user
- **Expected result:** Success; user shows banned; audit may record `user_banned`

### TC-12: Unban user

- **Priority:** High
- **Preconditions:** Target user is banned
- **Steps:**
  1. Click Unban user
- **Expected result:** Success; banned flag cleared

### TC-13: Cannot ban self

- **Priority:** Medium
- **Preconditions:** Admin opens their own detail page
- **Steps:**
  1. Inspect ban form
- **Expected result:** Ban controls disabled with helper text

## Edge Cases & Error States

- Empty user list still renders empty state
- Back link from detail returns to `/users`

## Out of Scope

- Impersonation
- Bulk role updates
- Create-user form
