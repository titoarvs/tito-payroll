# Payroll source data — QA Test Cases

## Overview

Typed HRIS clients for compensation reveal, leave, and holidays used by future pay engines.

- Hooks: `useRevealEmployeeCompensation`, `useLeaveRequestsForPayroll`, `useHolidaysForPayroll`
- Service: `payrollSourceService` → Nest `employee201` endpoints

## Prerequisites

- HRIS running with migration `0013_payroll_source_data` applied
- `npm run seed:rbac` so `employee201.holidays.view` / `.manage` exist
- Finance or admin JWT for holiday view; salary-view permission + grant for compensation reveal
- Test employee with salary (and preferably leave + a holiday in range)

## Test Cases

### TC-01: Reveal compensation returns salary and hourlyRate

- **Priority:** High
- **Preconditions:** Actor may view salary; employee has `salary` set
- **Steps:**
  1. Call `POST /api/employee201/employees/:id/salary` with a non-empty reason (or use `useRevealEmployeeCompensation`)
- **Expected result:** `data.salary` and `data.hourlyRate` are decimal strings; `hourlyRate` ≈ salary/22/8 unless overridden

### TC-02: Employee detail never includes salary amounts

- **Priority:** High
- **Steps:** `GET /api/employee201/employees/:id`
- **Expected result:** `salary` and `hourlyRate` are null/absent as amounts; `hasSalary` may be true; benefits flags (`sssCovered`, `withHmo`, …) may be present

### TC-03: Consultant flags

- **Priority:** High
- **Preconditions:** Employee employmentStatus is `consultant`
- **Expected result:** `withHmo` false; statutory coverage flags false; payroll routes to Hours × Rate only (no allowance, deductions, OT/ND/holiday, other, or 13th)

### TC-04: Leave list exposes pay treatment fields

- **Priority:** High
- **Steps:** List approved leave for an employee in a date range
- **Expected result:** Each row has `leaveTypeCode`, `isPaid`, `paidDays`, `unpaidDays`; `UNPAID` treated as LWOP

### TC-05: Holidays include premium percent

- **Priority:** High
- **Steps:** `GET /api/employee201/holidays?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Expected result:** Confirmed holidays only; `type` and `premiumPercent` present (Regular 100 / Special Non-Working 30 by default)

### TC-06: HMO not deducted

- **Priority:** Medium
- **Preconditions:** Employee `withHmo` true with provider/member number
- **Expected result:** Fields available for reference; no HMO amount field exists for deduction

## Edge Cases & Error States

- Missing salary reveal reason → 400
- No salary view grant → 403
- Empty holiday range → empty `data` array
- Money fields remain strings (never `number`)

## Out of Scope

- Running a full pay cutoff / payslip UI
- Contribution table lookup amounts
