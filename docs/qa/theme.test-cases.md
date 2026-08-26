# Theme — QA Test Cases

## Overview

Light / Dark / System toggle in dashboard topnav and on auth pages. Preference in `localStorage` (`ui-theme`). Default light.

Routes: any page with `ModeToggle` (e.g. `/sign-in`, `/dashboard`). Provider: `src/components/theme-provider.tsx`.

## Prerequisites

- Payroll app on `:3002`.
- Browser DevTools able to clear `localStorage` and change prefers-color-scheme (optional for System tests).

## Test Cases

### TC-01: First visit defaults to light

- **Priority:** High
- **Preconditions:** Clear `localStorage` for the payroll origin. OS set to dark (if possible).
- **Steps:**
  1. Open `/sign-in` (hard reload).
- **Expected result:** Page is light. `localStorage.ui-theme` is `light`. `<html>` has class `light` (not `dark`).

### TC-02: Switch to dark and persist

- **Priority:** High
- **Preconditions:** Signed in or on `/sign-in`.
- **Steps:**
  1. Open theme menu → Dark.
  2. Reload the page.
- **Expected result:** UI stays dark after reload. `ui-theme` is `dark`. `<html>` has class `dark`.

### TC-03: System follows OS

- **Priority:** Medium
- **Preconditions:** Theme set to System.
- **Steps:**
  1. Toggle OS color scheme (or emulate in DevTools) between light and dark.
- **Expected result:** App surface updates to match OS without changing `ui-theme` (still `system`).

### TC-04: Toggle on dashboard and sign-in

- **Priority:** High
- **Preconditions:** Any role signed in; also check signed-out `/sign-in`.
- **Steps:**
  1. On `/dashboard`, confirm theme button is left of notifications; cycle Light / Dark / System.
  2. Sign out; on `/sign-in`, confirm top-right theme toggle works the same.
- **Expected result:** Both surfaces update; preference is shared via `localStorage`.

### TC-05: No flash of wrong theme

- **Priority:** Medium
- **Preconditions:** `ui-theme` set to `dark`.
- **Steps:**
  1. Hard reload `/dashboard` or `/sign-in`.
- **Expected result:** First paint is dark (no brief light flash).

## Edge Cases & Error States

- Invalid `ui-theme` value → treated as light and re-seeded.
- MFA (`/auth/verify-mfa`) and auth success (`/auth/success`) also show the toggle.

## Out of Scope

- Syncing theme to HRIS / cross-app with T201 cookies.
- Per-user server stored on the server.
