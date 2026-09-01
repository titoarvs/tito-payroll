# Pay runs — QA Test Cases

## Overview

Cutoff create → compute → review → approve & release. Contribution table edits. Paper My payslips + notifications.

- Routes: `/dashboard/pay-runs`, `/dashboard/pay-runs/$id`, `/dashboard/contribution-tables`, `/dashboard/my-payslips`, `/dashboard/my-payslips/$id`
- Hooks: `usePayRuns`, `useComputePayRun`, `useReleasePayRun`, `useUpdatePayslip`, `useContributionSchedules`, `useMyPayslips`, `useMyPayslip`

## Prerequisites

- Latest payroll schema migration applied (payslip snapshot + OT/ND/holiday/adjustment columns; pay run `releasedBy` / `releasedAt`); `npm run seed:rbac`
- Finance/admin JWT for pay-run ops; employee/consultant JWT for My payslips
- Active employee with `userId` linked to Clock, hourly rate set, optional allowance
- At least one approved OT and/or ND and/or holiday-work claim in the cutoff window (for premium cases)
- Seeded SSS/HDMF/PhilHealth schedules

## Test Cases

### TC-01: Basic pay = hourly × Clock hours

- **Priority:** High
- **Preconditions:** Employee hourly rate `100.00`; 8 hours of completed Clock entries in period
- **Steps:** Create 2nd-half pay run for that date range → Compute
- **Expected result:** Payslip `basicPay` = `800.00`; `hoursWorked` = `8.00`

### TC-02: Gross = basic + allowance

- **Priority:** High
- **Preconditions:** Allowance (per cutoff) = `150.00` on employee
- **Steps:** Compute pay run
- **Expected result:** `grossPay` = basic + `150.00`

### TC-03: 1st cutoff deducts HDMF + PhilHealth, not SSS

- **Priority:** High
- **Steps:** Create pay run with `cutoffHalf=first` → Compute
- **Expected result:** `hdmf` and `philhealth` from tables (if covered); `sss` = `0.00`; no HMO field

### TC-04: 2nd cutoff deducts SSS only

- **Priority:** High
- **Steps:** Create pay run with `cutoffHalf=second` → Compute
- **Expected result:** `sss` from table; `hdmf`/`philhealth` = `0.00`

### TC-05: Coverage flags skip fund

- **Priority:** High
- **Preconditions:** `pagibigCovered=false`
- **Steps:** 1st cutoff compute
- **Expected result:** `hdmf` = `0.00`

### TC-06: Consultant — no statutory; same self-access

- **Priority:** High
- **Preconditions:** `employmentStatus=consultant`; linked user
- **Steps:** Compute → Approve & release → open My payslips as consultant
- **Expected result:** Gross = basic + allowance; all statutory `0.00`; paper slip visible; other employees' ids return 403

### TC-07: Unlinked Clock user → zero hours

- **Priority:** Medium
- **Preconditions:** Employee `userId` null
- **Expected result:** `hoursWorked` = `0.00`; basic = `0.00`

### TC-08: Compute pulls approved OT / ND / holiday only

- **Priority:** High
- **Preconditions:** Approved OT 2h; pending OT 3h; approved ND 4h; approved holiday work with premium
- **Steps:** Compute
- **Expected result:** OT hours/pay use approved 2h at 125%; ND at 10%; holiday uses instance premium (else 100%); pending OT ignored; net = gross + adjustments − deductions

### TC-09: Compute notifies payroll ops

- **Priority:** High
- **Steps:** Compute as finance
- **Expected result:** Users with `payroll.pay_runs.view` get `pay-run-computed` notification; payroll bell links to pay-run detail; regular employees do not see this type

### TC-10: Edit adjustment then approve & release

- **Priority:** High
- **Steps:** Compute → select payslip → change other adjustment → Save → Approve & release
- **Expected result:** Totals recalculate; button label is Approve & release; slips appear under each employee login immediately; each linked employee gets `payslip-released`

### TC-11: Release freezes recompute and edits

- **Priority:** High
- **Steps:** After release, Compute again and PATCH payslip
- **Expected result:** Conflict/forbidden errors

### TC-12: My payslips — paper layout + print

- **Priority:** High
- **Steps:** As employee open list → open slip → Print / Save as PDF
- **Expected result:** Only released own slips listed; paper layout (letterhead, rates, gross, deductions, adjustments, red net, prepared by); print stylesheet hides chrome

### TC-13: IDOR — another employee's payslip id

- **Priority:** High
- **Steps:** As employee A, `GET /api/payroll/payslips/{B's id}` (released)
- **Expected result:** 403; UI shows generic forbidden/empty state

### TC-14: Contribution bracket edit affects next compute

- **Priority:** Medium
- **Steps:** Change employee share on HDMF → recompute draft/computed 1st cutoff
- **Expected result:** New `hdmf` amount on payslips

### TC-15: Auth — employee cannot create pay run

- **Priority:** High
- **Steps:** Employee JWT `POST /api/payroll/pay-runs`
- **Expected result:** 403

### TC-16: T201 bell does not 404 on payroll types

- **Priority:** Medium
- **Steps:** With `pay-run-computed` / `payslip-released` in T201 notifications list (and optional `VITE_PAYROLL_APP_URL`)
- **Expected result:** Message shows; with base URL, opens payroll; without base URL, no in-app T201 route (no 404)

## Edge Cases & Error States

- periodStart after periodEnd → 400
- Money fields remain strings
- Open Clock timers excluded from hours
- Unlinked employees skip `payslip-released` notification
- Identity snapshot on payslip does not change when 201 profile is edited after compute

## Out of Scope

- BIR / tax values
- 13th-month engine (always `0.00`)
- Email / SMTP
- Clock WebSocket
- Granting people_culture payroll ops
- Stored PDF blobs / R2
