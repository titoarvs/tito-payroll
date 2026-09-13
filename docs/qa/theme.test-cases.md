# Theme — QA Test Cases

## Overview

Light / Dark / System toggle in dashboard topnav and on auth pages. Preference in `localStorage` (`ui-theme`). Default light. Typography is Poppins; brand colors stay Tito green/navy.

Routes: any page with `ModeToggle` (e.g. `/sign-in`, `/dashboard`). Provider: `src/components/theme-provider.tsx`. Tokens: `src/styles/app.css`.

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

### TC-06: Poppins typography

- **Priority:** Medium
- **Preconditions:** Any signed-in dashboard page.
- **Steps:**
  1. Inspect `body` (or a page title) computed `font-family`.
- **Expected result:** Stack includes **Poppins** (not Mont). Headings use slightly tighter tracking.

### TC-07: Glass header respects reduced transparency

- **Priority:** Low
- **Preconditions:** DevTools → emulate `prefers-reduced-transparency: reduce`.
- **Steps:**
  1. Open `/dashboard` and inspect the sticky header (`.glass-nav`).
- **Expected result:** Header uses a solid background (no blur). Auth glass cards are also solid if on `/sign-in`.

### TC-08: White KPI tiles and shell accents

- **Priority:** Medium
- **Preconditions:** Payroll ops user on `/dashboard`.
- **Steps:**
  1. Confirm KPI tiles share the same white card background (no pastel color washes).
  2. Confirm light sidebar with **General** / **Organization** labels; active item is a solid Tito-navy pill with light text; primary buttons remain Tito green.
- **Expected result:** Layout matches refined chrome; brand colors stay Tito green/navy.

### TC-09: Soft table chrome

- **Priority:** Medium
- **Preconditions:** Ops user; open Employees, Pay runs, My payslips, or Salary rates history.
- **Steps:**
  1. Inspect any data table inside a card.
- **Expected result:** Muted header band; hairline horizontal row dividers only (no vertical column rules); comfortable cell padding; card uses soft `rounded-xl` corners.

## Edge Cases & Error States

- Invalid `ui-theme` value → treated as light and re-seeded.
- MFA (`/auth/verify-mfa`) and auth success (`/auth/success`) also show the toggle.
- `prefers-reduced-motion: reduce` — card hover lift disabled; auth enter animations become simple fades.

## Out of Scope

- Syncing theme to HRIS / cross-app with T201 cookies.
- Per-user theme stored on the server.
- Switching primary brand to purple / Poppins-only brand guide palette.
