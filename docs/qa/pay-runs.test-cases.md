# Pay runs — QA Test Cases

## Overview

Cutoff create → compute → review → approve & release. Contribution table edits. Paper My payslips + notifications.

- Routes: `/dashboard/pay-runs`, `/dashboard/pay-runs/$id`, `/dashboard/contribution-tables`, `/dashboard/my-payslips`, `/dashboard/my-payslips/$payslipId`
- Hooks: `usePayRuns`, `useComputePayRun`, `useReleasePayRun`, `useUpdatePayslip`, `useContributionSchedules`, `useMyPayslips`, `usePayslip`

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

### TC-06: Consultant — hours × rate only; same self-access

- **Priority:** High
- **Preconditions:** `employmentStatus=consultant`; linked user; employee may have allowance and approved OT/ND/holiday claims
- **Steps:** Compute → Approve & release → open My payslips as consultant
- **Expected result:** Gross = Basic = Hours × Rate (allowance ignored); all statutory `0.00`; OT/ND/holiday/other/13th `0.00`; paper slip visible; other employees' ids return 403; other-adjustment editor hidden; PATCH adjustment → 400

### TC-07: Unlinked Clock user → zero hours

- **Priority:** Medium
- **Preconditions:** Employee `userId` null
- **Expected result:** `hoursWorked` = `0.00`; basic = `0.00`

### TC-08: Compute pulls approved OT / ND / holiday only

- **Priority:** High
- **Preconditions:** Approved OT 2h; pending OT 3h; approved ND 4h; approved holiday work with premium
- **Steps:** Compute
- **Expected result:** OT hours/pay use approved 2h at 125%; ND at 10%; holiday uses instance premium (else 100%); pending OT ignored; net = gross + adjustments − deductions

### TC-08b: Payslip grid shows employee name + code

- **Priority:** High
- **Preconditions:** Computed pay run with at least one payslip for a known employee201 row.
- **Steps:**
  1. Open `/dashboard/pay-runs/$id`.
- **Expected result:** Employee column shows display name (not only UUID). Secondary line shows `#employeeCode` when present, otherwise the employee id. API `GET .../payslips` includes `employeeName` and `employeeCode`.

### TC-08c: Payslip grid pagination

- **Priority:** Medium
- **Preconditions:** Computed pay run with more than 10 payslips (or change rows per page to a size smaller than the list).
- **Steps:**
  1. Open `/dashboard/pay-runs/$id`.
  2. Confirm footer shows `1–N of T payslips`, rows-per-page selector, Previous/Next.
  3. Change rows per page; go to next page.
- **Expected result:** Table shows only the current page of rows; page resets to 1 when page size changes; Previous disabled on page 1; Next disabled on last page.

### TC-09: Compute notifies payroll ops

- **Priority:** High
- **Steps:** Compute as finance
- **Expected result:** Users with `payroll.pay_runs.view` get `pay-run-computed` notification; payroll bell links to pay-run detail; regular employees do not see this type

### TC-09b: View payslip details page

- **Priority:** High
- **Preconditions:** At least one released payslip for the signed-in employee
- **Steps:**
  1. Open `/dashboard/my-payslips`
  2. Click a period link or **View**
- **Expected result:** Dedicated payslip details page matching the document layout: period/payment date, company block, employee info (name, ID, department, job title, status, TIN), statutory IDs, rate details, earnings/deductions tables, and net pay summary. Back returns to the list. Print / Download PDF open the browser print dialog.
- **Auth:** Opening another employee’s payslip id → 403/Forbidden message

### TC-09c: Contribution tables show seeded brackets

- **Priority:** High
- **Preconditions:** `npm run seed:contribution-schedules` run in `tito-hris-api`; ops user
- **Steps:**
  1. Open `/dashboard/contribution-tables`
  2. Open the Schedule select
- **Expected result:** SSS, HDMF, and PhilHealth schedules listed with bracket counts; selecting one shows Min / Max / Employee share / Employer share rows with money values (not blank page).

### TC-10: Edit adjustment then approve & release

- **Priority:** High
- **Steps:**
  1. Compute → select non-consultant payslip
  2. Change other adjustment without a reason → Save
  3. Enter a reason → Save
  4. Approve & release
- **Expected result:** Step 2 → 400 (reason required). Step 3 → totals recalculate; `other` adjustment note stores the reason; T201 Audit Trail module **Payroll** shows `otherAdjustment` update with `{amount} | {reason}`. After release, slips appear under each employee login; each linked employee gets `payslip-released`.

### TC-10c: 13th month when batch is flagged

- **Priority:** High
- **Preconditions:** At least one released payslip earlier in the same calendar year with known Basic; create a new draft with **Include 13th month pay** checked
- **Steps:** Compute
- **Expected result:** Each non-consultant slip has `thirteenthMonthPay` = 1/12 of (prior released Basic YTD + this cutoff Basic). Unflagged batch → all `0.00`. Consultant on a flagged batch → `0.00`.

### TC-10b: Remove contribution bracket

- **Priority:** Medium
- **Preconditions:** Schedule with 2+ brackets
- **Steps:**
  1. Open Contribution tables; select a fund
  2. Click **Remove** on one bracket row
  3. Click **Save brackets**
- **Expected result:** Row disappears from the draft immediately; after save and refresh, that bracket is gone from the schedule.

### TC-11: Release freezes recompute and edits

- **Priority:** High
- **Steps:** After release, Compute again and PATCH payslip
- **Expected result:** Conflict/forbidden errors

### TC-12: My payslips — paper layout + print

- **Priority:** High
- **Steps:** As employee open list → open slip → Print / Save as PDF
- **Expected result:** Only released own slips listed; paper layout (letterhead, rates, gross, deductions, adjustments, red net, prepared by); print stylesheet hides chrome

### TC-12b: Create pay run with period date range

- **Priority:** High
- **Steps:**
  1. Open `/dashboard/pay-runs`.
  2. Click Period to open the dual-month calendar. Pick a start day, then an end day.
  3. Confirm cutoff half, click Create.
- **Expected result:** Draft pay run appears with the selected period. Completing the range commits and closes the picker.

### TC-13: IDOR — another employee's payslip id

- **Priority:** High
- **Steps:** As employee A, `GET /api/payroll/payslips/{B's id}` (released)
- **Expected result:** 403; UI shows generic forbidden/empty state

### TC-14: Contribution bracket edit affects next compute

- **Priority:** Medium
- **Preconditions:** Seeded contribution schedules
- **Steps:** Change employee share on HDMF → recompute draft/computed 1st cutoff
- **Expected result:** New `hdmf` amount on payslips

### TC-17: Paid leave restores Basic (no additive leave pay)

- **Priority:** High
- **Preconditions:** Approved paid leave overlapping period with little/no Clock that day; separate case with `UNPAID` / LWOP; consultant with paid leave type
- **Steps:** Compute pay run
- **Expected result:** Paid leave → `hoursWorked` includes restored gap (`max(0, expected − clocked)`); `basicPay` / `grossPay` include those hours at hourly; `leavePay` = `0.00` (no additive adjustment); unpaid days → `unpaidLeaveDays` set, restore `0`, Clock hours unchanged; consultant → no restore, `leavePay` `0.00`

### TC-18: Withholding tax from Gross − contributions

- **Priority:** High
- **Preconditions:** Seeded tax schedule; employee covered, not consultant; Gross large enough that `(gross − contributions) × 2` hits a taxable TRAIN bracket
- **Steps:** Compute
- **Expected result:** `withholdingTax` = half of monthly TRAIN on `(gross − SSS − HDMF − PhilHealth) × 2`; appears on paper slip; consultants / uncovered → `0.00`

### TC-19: Tax tables RBAC

- **Priority:** High
- **Steps:** User without `payroll.tax_tables.view` / `manage` hits tax-schedules endpoints; ops open `/dashboard/tax-tables`
- **Expected result:** 403 without permission; **finance** and **super_admin** can view/edit brackets; **admin** (HR) can view only (Save / Add hidden; PUT brackets → 403)

### TC-19b: Super Admin cannot process pay runs

- **Priority:** High
- **Preconditions:** `super_admin` JWT
- **Steps:**
  1. Open `/dashboard/pay-runs` and a draft/computed `$id`
  2. Attempt `POST .../compute`, `POST .../release`, `PATCH .../payslips/:id`
- **Expected result:** Create / Compute / Approve & release / Save adjustment controls hidden; API returns 403

### TC-19c: HR cannot edit contribution tables

- **Priority:** High
- **Preconditions:** `admin` JWT
- **Steps:** Open `/dashboard/contribution-tables` → Brackets → attempt Save / PUT brackets
- **Expected result:** Inputs read-only; Add/Save/Remove hidden; API 403 on manage endpoints; compute/release still available on pay runs

### TC-20: Other adjustment PATCH still works

- **Priority:** High
- **Steps:** Computed run → edit Other adjustment → Save
- **Expected result:** Net recalculates; `other` adjustment line upserted; leave/tax unchanged

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
- Unlinked Clock `userId` → zero Clock hours; paid leave still restores via `employee.id`
- Identity snapshot on payslip does not change when 201 profile is edited after compute

## Out of Scope

- Identity contract / BUG-TC-01
- Renaming `pay_run` HTTP path to Batch
- ND-PR-13 (subtract Clock hours for LWOP)
- Full BIR productization beyond versioned table + half-monthly apply
- Automatic December 13th-month payout (HR flags the batch)
- Subtracting 13th month already paid earlier in the same year
- Email / SMTP delivery
- Clock WebSocket sync
- Granting people_culture payroll ops
- Stored PDF blobs / R2
