# Pay runs — QA Test Cases

## Overview

Cutoff create → compute → review → release. Contribution table edits. My payslips for employees.

- Routes: `/dashboard/pay-runs`, `/dashboard/pay-runs/$id`, `/dashboard/contribution-tables`, `/dashboard/my-payslips`
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

### TC-09: My payslips — released only

- **Priority:** High
- **Steps:** As employee open `/dashboard/my-payslips` before and after release
- **Expected result:** Empty until release; then shows net/gross

### TC-10: Contribution bracket edit affects next compute

- **Priority:** Medium
- **Steps:** Change employee share on HDMF → recompute draft/computed 1st cutoff
- **Expected result:** New `hdmf` amount on payslips

### TC-11: Auth — employee cannot create pay run

- **Priority:** High
- **Steps:** Employee JWT `POST /api/payroll/pay-runs`
- **Expected result:** 403

## Edge Cases & Error States

- periodStart after periodEnd → 400
- Money fields remain strings
- Open Clock timers excluded from hours

## Out of Scope

- BIR / tax
- OT / holiday / leave engines
- PDF payslip
