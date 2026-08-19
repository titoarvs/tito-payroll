# Analytics — QA Test Cases

## Overview

First-party events + `/admin/analytics` dashboard + optional GA4.

## Prerequisites

- Admin account; browse a few pages while signed in

## Test Cases

### TC-01: Page views recorded

- **Priority:** High
- **Steps:** Navigate between `/dashboard` and `/shop`
- **Expected result:** `page_view` rows appear in `analytics_event`

### TC-02: Admin dashboard KPIs

- **Priority:** High
- **Steps:** Open `/admin/analytics` and switch ranges
- **Expected result:** Cards and sparkline update; no crash on empty data

### TC-03: Non-admin blocked

- **Priority:** High
- **Steps:** Visit `/admin/analytics` as `user`
- **Expected result:** Redirect away

### TC-04: Signup / login / purchase events

- **Priority:** Medium
- **Steps:** Sign up, sign in, complete paid order (if Stripe set)
- **Expected result:** Matching `signup` / `login` / `purchase` events

### TC-05: GA4 optional

- **Priority:** Low
- **Preconditions:** Measurement id unset vs set
- **Steps:** View page source / network
- **Expected result:** No gtag scripts when unset; gtag loads when set

## Edge Cases & Error States

- Invalid `/api/events` body returns 400 without throwing in UI
- Throttled IPs still get `{ ok: true }`

## Out of Scope

- Funnels / session replay
- Multi-node rate limiting
