# Notifications — QA Test Cases

## Overview

In-app notifications at `/notifications` with unread bell badge.

## Prerequisites

- Signed-in user; ability to trigger signup / role change / paid order

## Test Cases

### TC-01: Guest cannot open notifications

- **Priority:** High
- **Steps:** Visit `/notifications` while signed out
- **Expected result:** Redirect to login

### TC-02: Welcome notification on signup

- **Priority:** High
- **Steps:** Create a new account
- **Expected result:** Welcome notification appears; optional email/console log

### TC-03: Role change notifies target user

- **Priority:** High
- **Steps:** Admin changes a user’s role
- **Expected result:** Target sees “Role updated” notification

### TC-04: Mark one / mark all read

- **Priority:** Medium
- **Steps:**
  1. Open `/notifications` with unread items
  2. Mark one read, then mark all read
- **Expected result:** Unread badge decreases; items show read state

### TC-05: Order paid notification

- **Priority:** High
- **Preconditions:** Stripe webhook configured
- **Steps:** Complete a test checkout
- **Expected result:** Order paid notification + receipt email/console

## Edge Cases & Error States

- Email failures must not roll back the notification row
- Marking another user’s notification id is a no-op (ownership filter)

## Out of Scope

- Push / realtime websockets
- Notification preferences
