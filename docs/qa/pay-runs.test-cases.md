# Pay runs — QA Test Cases

## Overview

Cutoff create → compute → review → release. Contribution table edits. My payslips for employees.

- Routes: `/dashboard/pay-runs`, `/dashboard/pay-runs/$id`, `/dashboard/contribution-tables`, `/dashboard/my-payslips`, `/dashboard/my-payslips/$payslipId`
- Hooks: `usePayRuns`, `useComputePayRun`, `useReleasePayRun`, `useContributionSchedules`, `useMyPayslips`

## Prerequisites

- HRIS migrations `0014` + `0015` applied; `npm run seed:rbac`
- Finance/admin JWT for pay-run ops; employee JWT for My payslips
- Active employee with `userId` linked to Clock, hourly rate set, optional allowance
- Seeded SSS/HDMF/PhilHealth schedules

## Test Cases

### TC-01: Basic Pay = hourly × Clock hours

- **Priority:** High
- **Preconditions:** Employee hourly rate `100.00`; 8 hours of completed Clock entries in period
- **Steps:** Create 2nd-half pay run for that date range → Compute
- **Expected result:** Payslip `basicPay` = `800.00`; `hoursWorked` = `8.00`

### TC-02: Gross = Basic + Allowance

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

### TC-06: Consultant — no statutory

- **Priority:** High
- **Preconditions:** `employmentStatus=consultant`
- **Expected result:** Gross = basic + allowance; all statutory `0.00`

### TC-07: Unlinked Clock user → zero hours

- **Priority:** Medium
- **Preconditions:** Employee `userId` null
- **Expected result:** `hoursWorked` = `0.00`; basic = `0.00`

### TC-08: Release freezes recompute

- **Priority:** High
- **Steps:** Compute → Release → Compute again
- **Expected result:** Second compute returns conflict/error

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

### TC-09: My payslips — released only

- **Priority:** High
- **Steps:** As employee open `/dashboard/my-payslips` before and after release
- **Expected result:** Empty until release; then shows net/gross

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

### TC-10: Contribution bracket edit affects next compute

- **Priority:** Medium
- **Preconditions:** Seeded contribution schedules
- **Steps:** Change employee share on HDMF → recompute draft/computed 1st cutoff
- **Expected result:** New `hdmf` amount on payslips

### TC-10b: Remove contribution bracket

- **Priority:** Medium
- **Preconditions:** Schedule with 2+ brackets
- **Steps:**
  1. Open Contribution tables; select a fund
  2. Click **Remove** on one bracket row
  3. Click **Save brackets**
- **Expected result:** Row disappears from the draft immediately; after save and refresh, that bracket is gone from the schedule.

### TC-11: Auth — employee cannot create pay run

- **Priority:** High
- **Steps:** Employee JWT `POST /api/payroll/pay-runs`
- **Expected result:** 403

### TC-12: Create pay run with period date range

- **Priority:** High
- **Steps:**
  1. Open `/dashboard/pay-runs`.
  2. Click Period to open the dual-month calendar. Pick a start day, then an end day.
  3. Confirm cutoff half, click Create.
- **Expected result:** Draft pay run appears with the selected period. Completing the range commits and closes the picker.

## Edge Cases & Error States

- periodStart after periodEnd → 400
- Money fields remain strings
- Open Clock timers excluded from hours

## Out of Scope

- BIR / tax
- OT / holiday / leave engines
- PDF payslip
