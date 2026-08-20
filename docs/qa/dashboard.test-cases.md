# Dashboard shell — QA Test Cases

## Overview

Authenticated shell: topnav for all roles; icon sidenav (Dashboard + Employees) for `super_admin` only.

Routes: `/dashboard`, `/dashboard/employees`. Layout: `src/components/layout/app-shell.tsx`.

Employees page content (cards, search, pagination) is covered in [employees.test-cases.md](./employees.test-cases.md).

## Prerequisites

- HRIS API running; payroll app on `:3002`.
- A `super_admin` account and an `employee` (or other non-super-admin) account.

## Test Cases

### TC-01: Super admin lands on dashboard shell after login

- **Priority:** High
- **Preconditions:** Signed out; `super_admin` credentials available.
- **Steps:**
  1. Open `/sign-in` and sign in successfully.
- **Expected result:** Redirect to `/dashboard`. Sidenav shows **Dashboard** (active) and **Employees** with icons and labels. Topnav shows “Payroll”, notifications button, and user avatar. Main area is empty (no cards/widgets).

### TC-02: Employee sees topnav only

- **Priority:** High
- **Preconditions:** Signed out; `employee` credentials available.
- **Steps:**
  1. Sign in as employee.
- **Expected result:** Land on `/dashboard`. Topnav present. No sidenav. Main area empty.

### TC-03: Employee cannot open Employees route

- **Priority:** High
- **Preconditions:** Signed in as `employee`.
- **Steps:**
  1. Navigate to `/dashboard/employees` (paste URL).
- **Expected result:** Redirect to `/dashboard`. Still no sidenav.

### TC-04: Super admin can open Employees page

- **Priority:** High
- **Preconditions:** Signed in as `super_admin`.
- **Steps:**
  1. Click Employees in the sidenav (or open `/dashboard/employees`).
- **Expected result:** URL is `/dashboard/employees`. Employees icon is active. Main area shows the employees roster UI (search, cards, or empty/loading state — not a blank page). See [employees.test-cases.md](./employees.test-cases.md) for roster behavior.

### TC-05: Notifications and avatar chrome

- **Priority:** Medium
- **Preconditions:** Signed in as any role.
- **Steps:**
  1. Confirm theme toggle and notifications button are visible and focusable.
  2. Click avatar → Sign out.
- **Expected result:** Theme toggle and notifications do not crash. Sign out clears session and returns to `/sign-in`.

### TC-06: Root and signed-in redirects

- **Priority:** Medium
- **Preconditions:** Session present / absent.
- **Steps:**
  1. With session, visit `/`.
  2. Without session, visit `/dashboard`.
  3. With session, visit `/sign-in`.
- **Expected result:** `/` → `/dashboard`; unauthenticated `/dashboard` → `/sign-in`; signed-in `/sign-in` → `/dashboard`.

## Edge Cases & Error States

- User with `roles: ["super_admin"]` but empty `role` still sees sidenav.
- Avatar without `http(s)` image shows initials.
- Google / MFA success also land on `/dashboard`.

## Out of Scope

- Notification list or API.
- Employee card search/pagination detail — see [employees.test-cases.md](./employees.test-cases.md).
- Branch selector, dashboard widgets from the design mock.
- Full theme matrix — see [theme.test-cases.md](./theme.test-cases.md).
