# Salary rates — QA Test Cases

## Overview

Dedicated ops page to enter employee salary rates. Route `/dashboard/salary-rates`. HRIS: `GET/POST /api/payroll/employees/:employeeId/salary-rates`.

## Prerequisites

- Role: finance / admin / super_admin (payroll ops)
- HRIS RBAC seeded with `payroll.salary_rates.view` and `payroll.salary_rates.manage`
- Test employee with linked HRIS `userId`
- Optional: employee without `userId` for negative case

## Test Cases

### TC-01: Save monthly + hourly + allowance

- **Priority:** High
- **Preconditions:** Ops user; employee with linked `userId`
- **Steps:**
  1. Open `/dashboard/salary-rates`
  2. Select an employee
  3. Enter monthly `50000.00` (hourly auto-fills disabled field)
  4. Enter allowance `1000.00` (per cutoff)
  5. Keep effective from (defaults today); Save
- **Expected result:** Toast success; current summary shows new monthly/hourly/allowance; history row appears Active; URL has `?employeeId=…`

### TC-01b: Deep link from employee detail

- **Priority:** Medium
- **Preconditions:** Ops user on employee detail with pay snapshot
- **Steps:**
  1. Click **Manage rates**
- **Expected result:** Salary rates page opens with that employee selected and form seeded

### TC-02: Hourly auto-compute (read-only)

- **Priority:** Medium
- **Preconditions:** Ops user; employee selected
- **Steps:**
  1. Clear/reset then type monthly `22000.00`
  2. Confirm hourly shows `125.00` and the field is disabled
  3. Change monthly to `44000.00` → hourly updates to `250.00`
  4. Save with effective from
- **Expected result:** Saved hourly is the derived value; hourly cannot be typed over

### TC-03: Validation — missing / invalid money or dates

- **Priority:** High
- **Preconditions:** Ops user; employee selected
- **Steps:**
  1. Clear monthly and Save → inline form error, no request
  2. Enter monthly `abc`, valid hourly, date → inline or API error; form retained
  3. Enter valid money with effective to before from → inline error about dates
- **Expected result:** No new history row; clear error feedback

### TC-04: Employee without linked user

- **Priority:** High
- **Preconditions:** Employee row with no `userId`
- **Steps:**
  1. Select that employee in the left list
- **Expected result:** Panel explains account must be linked; Open employee profile available; no form save

### TC-05: Auth — non-ops cannot access

- **Priority:** High
- **Preconditions:** Regular employee JWT (no payroll ops)
- **Steps:**
  1. Confirm Salary rates nav item is hidden
  2. Call `GET /api/payroll/employees/:id/salary-rates` directly
- **Expected result:** 403; UI does not expose amounts via this page

### TC-06: History deactivates previous active

- **Priority:** Medium
- **Preconditions:** Employee already has an active rate
- **Steps:**
  1. Add a second rate with a new effective from
- **Expected result:** Newest row Active; previous row Inactive; employee201 fields match newest

### TC-07: Empty history

- **Priority:** Low
- **Preconditions:** Linked employee with no prior rates
- **Steps:**
  1. Select employee
- **Expected result:** Summary shows — for amounts; history empty state; form usable

### TC-08: Employee list pagination + avatars

- **Priority:** Medium
- **Preconditions:** More than 10 employees; ops user
- **Steps:**
  1. Open Salary rates; confirm left list shows avatars (photo or initials)
  2. Change page / rows per page in the list footer
- **Expected result:** List pages via HRIS meta; selected employee (and form) can stay when paging away; avatars render without broken images

## Edge Cases & Error States

- Comma-formatted money rejected or normalized server-side (decimal string expected)
- Network failure on save → error toast, form kept
- Search filters employee select list

## Out of Scope

- Bulk import
- Editing historical rows
- Payslip PDF
