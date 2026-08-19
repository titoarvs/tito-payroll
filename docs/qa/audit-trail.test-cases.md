# Audit Trail — QA Test Cases

## Overview

Admin audit log at `/audit` with filters and pagination.

## Prerequisites

- Admin session
- Prior activity that produces events (login, role change, password reset)

## Test Cases

### TC-01: View audit events

- **Priority:** High
- **Preconditions:** At least one audit row exists
- **Steps:**
  1. Open `/audit`
- **Expected result:** Newest events first; columns for when, action, actor, target, details

### TC-02: Filter by action

- **Priority:** High
- **Preconditions:** Multiple action types present
- **Steps:**
  1. Select `role_changed` in Action
  2. Submit Filter
- **Expected result:** Only `role_changed` rows shown

### TC-03: Filter by actor email

- **Priority:** Medium
- **Preconditions:** Known actor email in the log
- **Steps:**
  1. Enter a partial actor email
  2. Submit Filter
- **Expected result:** Only matching actor rows shown

### TC-04: Pagination

- **Priority:** Medium
- **Preconditions:** More than 20 audit rows
- **Steps:**
  1. Open `/audit`
  2. Click Next, then Previous
- **Expected result:** Page indicator updates; rows change; filters preserved in the URL

### TC-05: Login creates audit row

- **Priority:** High
- **Preconditions:** Admin can view `/audit`
- **Steps:**
  1. Sign out and sign in again
  2. Open `/audit`
- **Expected result:** New `login` event with actor email (IP/user-agent when available)

### TC-06: Non-admin cannot access audit page

- **Priority:** High
- **Preconditions:** Signed in as `user`
- **Steps:**
  1. Navigate to `/audit`
- **Expected result:** Redirected away; no audit data exposed

### TC-07: Empty state

- **Priority:** Low
- **Preconditions:** Fresh database with no audit rows (or filters that match nothing)
- **Steps:**
  1. Open `/audit` with a non-matching filter
- **Expected result:** Empty-state message; no errors

## Edge Cases & Error States

- Invalid `action` query param ignored (shows all)
- Actor filter is case-insensitive

## Out of Scope

- Export / CSV download
- Retention / deletion jobs
