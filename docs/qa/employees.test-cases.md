# Employees — QA Test Cases

## Overview

Super-admin employee card grid with search and 15-per-page pagination. Click a card to open the employee detail header.

- Routes: `/dashboard/employees`, `/dashboard/employees/$id`
- Hooks: `useEmployees`, `useEmployee`
- Endpoints: `GET /api/employee201/employees`, `GET /api/employee201/employees/:id` (HRIS schema `employee201.employee`, not T201 `tito_people`)

## Prerequisites

- HRIS API running; payroll app on `:3002`.
- A `super_admin` account with `employee201.employees.view` (and ability to call get-by-id).
- `employee201.employee` populated (from `tito-hris-api/`: `npm run seed:employees` after `seed:users`). Seed yields 17 rows — enough for pagination.
- A non-`super_admin` account for redirect checks.

## Test Cases

### TC-01: Super admin sees employee cards

- **Priority:** High
- **Preconditions:** Signed in as `super_admin`; employees exist in HRIS.
- **Steps:**
  1. Open `/dashboard/employees`.
- **Expected result:** Page title “Employees”. Cards show avatar (or initials), name, and position. No Get in touch / bookmark / share buttons. At most 15 cards on page 1.

### TC-02: Non-super-admin redirected from list

- **Priority:** High
- **Preconditions:** Signed in as employee (or other non-super-admin).
- **Steps:**
  1. Navigate to `/dashboard/employees`.
- **Expected result:** Redirect to `/dashboard`. No employee list.

### TC-03: Search filters roster

- **Priority:** High
- **Preconditions:** Known employee name/email/code in the roster.
- **Steps:**
  1. Type a matching fragment in the search box.
  2. Wait ~300ms.
- **Expected result:** Cards update to matching employees. Range text reflects filtered total.

### TC-04: Search with no matches

- **Priority:** Medium
- **Preconditions:** Signed in as `super_admin`.
- **Steps:**
  1. Search for a string that matches no employee.
- **Expected result:** Message “No employees match your search.” Pager shows “No results”.

### TC-05: Search resets to page 1

- **Priority:** Medium
- **Preconditions:** More than 15 employees; on page 2+.
- **Steps:**
  1. Go to page 2.
  2. Enter a search term.
- **Expected result:** After debounce, page indicator is page 1 of the filtered result set.

### TC-06: Pagination — 15 per page

- **Priority:** High
- **Preconditions:** At least 16 employees; empty search.
- **Steps:**
  1. Open Employees.
  2. Click Next.
  3. Click Previous.
- **Expected result:** Page 1 shows up to 15 cards. Next loads page 2. Previous returns to page 1. Range text like `1–15 of N` then `16–… of N`.

### TC-07: Pagination ends disabled

- **Priority:** Medium
- **Preconditions:** Any roster size.
- **Steps:**
  1. On page 1, inspect Previous.
  2. Navigate to the last page; inspect Next.
- **Expected result:** Previous disabled on first page. Next disabled on last page.

### TC-08: Empty roster

- **Priority:** Low
- **Preconditions:** No employees in HRIS (or filtered env with none).
- **Steps:**
  1. Open Employees with empty search.
- **Expected result:** “No employees found.”

### TC-09: Missing photo / position

- **Priority:** Medium
- **Preconditions:** Employees without `userImage` and/or `position`.
- **Steps:**
  1. Open Employees.
- **Expected result:** Initials instead of photo; position shows “—” when missing. Name still visible.

### TC-10: API forbidden / error on list

- **Priority:** Medium
- **Preconditions:** Session valid in UI but API returns 403/500 (or revoke permission temporarily).
- **Steps:**
  1. Open Employees.
- **Expected result:** Error message shown; no silent empty grid pretending success.

### TC-11: Click card opens detail header

- **Priority:** High
- **Preconditions:** Signed in as `super_admin`; at least one employee on the list.
- **Steps:**
  1. Open `/dashboard/employees`.
  2. Click an employee card.
- **Expected result:** Navigates to `/dashboard/employees/<id>`. Detail header shows cover, avatar (or initials), name, `#code • position`, Active/Inactive pill, and four cards (Department, Employment Type, Email, Phone Number). “Back to employees” link is visible.

### TC-12: Detail header field mapping

- **Priority:** High
- **Preconditions:** Known employee with department, employment status, email, phone.
- **Steps:**
  1. Open that employee’s detail page.
- **Expected result:** Department shown as a blue-dot pill (or `—` if missing). Employment Type shows title-cased `employmentStatus`. Email and phone match HRIS (or `—`). No salary anywhere on the page. No three-dot menu / action menu.

### TC-13: Detail 404

- **Priority:** Medium
- **Preconditions:** Signed in as `super_admin`.
- **Steps:**
  1. Navigate to `/dashboard/employees/does-not-exist-id`.
- **Expected result:** “Employee not found.” (or API error message). No blank header pretending success.

### TC-14: Non-super-admin redirected from detail

- **Priority:** High
- **Preconditions:** Signed in as non-`super_admin`; a valid employee id from seed/HRIS.
- **Steps:**
  1. Navigate to `/dashboard/employees/<id>`.
- **Expected result:** Redirect to `/dashboard`. Detail header not shown.

### TC-15: Back to employees

- **Priority:** Medium
- **Preconditions:** On a valid detail page as `super_admin`.
- **Steps:**
  1. Click “Back to employees”.
- **Expected result:** Returns to `/dashboard/employees`.

## Edge Cases & Error States

- Debounced search should not fire a request on every keystroke.
- Clearing search restores the full roster from page 1.
- Loading state shows “Loading employees…” on first list load and “Loading employee…” on detail.
- Missing department / phone / position on detail render as `—`.

## Out of Scope

- Division/department/status filters on the list.
- Tabs, edit, documents, evaluations, salary reveal.
- Avatar upload.
- Non-super-admin employee list/detail access.
- Profile-view audit POST.
