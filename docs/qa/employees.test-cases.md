# Employees — QA Test Cases

## Overview

Super-admin employee card grid with search and 15-per-page pagination. Click a card to open the employee detail header.

Regular employees see only their own profile header on `/dashboard` (no roster).

- Routes: `/dashboard`, `/dashboard/employees`, `/dashboard/employees/$id`
- Hooks: `useEmployees`, `useEmployee`, `useMyEmployee`
- Endpoints: `GET /api/employee201/employees`, `GET /api/employee201/employees/me`, `GET /api/employee201/employees/:id` (HRIS schema `employee201.employee`, not T201 `tito_people`)

## Prerequisites

- HRIS API running; payroll app on `:3002`.
- A `super_admin` account with `employee201.employees.view` (and ability to call get-by-id).
- `employee201.employee` populated (from `tito-hris-api/`: `npm run seed:employees` after `seed:users`). Seed yields 17 rows — enough for pagination.
- A non-`super_admin` account with a linked employee row (e.g. seed `ada.lovelace@seed.titosolutions.ph`) for self-profile checks.
- A non-`super_admin` account **without** a linked employee row (optional, legacy only) for 404 — new Google/register users get an auto stub.

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
- **Expected result:** Redirect to `/dashboard`. Detail header not shown via the roster detail route.

### TC-15: Back to employees

- **Priority:** Medium
- **Preconditions:** On a valid detail page as `super_admin`.
- **Steps:**
  1. Click “Back to employees”.
- **Expected result:** Returns to `/dashboard/employees`.

### TC-16: Employee sees own profile on dashboard

- **Priority:** High
- **Preconditions:** Signed in as non-`super_admin` with a linked `employee201.employee` row (e.g. Ada Lovelace seed).
- **Steps:**
  1. Open `/dashboard` (or land there after sign-in).
- **Expected result:** `EmployeeDetailHeader` shows own name, `#employeeCode • position`, Active/Inactive, and four info cards (Department, Employment Type, Email, Phone). No “Back to employees”. No Employees sidenav. No salary. Avatar from account photo if present, else initials.

### TC-17: Employee self-profile — no linked record

- **Priority:** High
- **Preconditions:** Signed in as non-`super_admin` with no `employee.userId` link **and** login email does not match any `employee.email` (legacy account created before stub-on-signup).
- **Steps:**
  1. Open `/dashboard`.
- **Expected result:** Message “No employee record linked to your account.” No header card. Still no Employees sidenav/roster.

### TC-17b: Fresh Google / register creates employee201 stub

- **Priority:** High
- **Preconditions:** Brand-new Google (or register) account that did not exist in `auth.users` or `employee201.employee`.
- **Steps:**
  1. Sign in to payroll with Google (or complete register).
  2. As that user, open `/dashboard`.
  3. As a `super_admin`, open `/dashboard/employees` and search the new user’s email/name.
- **Expected result:** Self-profile header appears (not the “No employee record” message). New stub is `probationary`, position may be `—`. In HRIS DB, `employee.id` and `employee.userId` both equal the new `auth.users.id`. Super-admin roster includes the stub.

### TC-18: Super-admin dashboard has no self-profile header

- **Priority:** Medium
- **Preconditions:** Signed in as `super_admin`.
- **Steps:**
  1. Open `/dashboard`.
- **Expected result:** Empty home (no self `EmployeeDetailHeader`). Employees available via sidenav.

### TC-19: Email match auto-links unlinked employee row

- **Priority:** High
- **Preconditions:** Auth user email equals an `employee201.employee.email` whose `userId` is null. Signed in as that non-`super_admin` user.
- **Steps:**
  1. Open `/dashboard`.
  2. Optionally re-open `/dashboard` or call `GET /api/employee201/employees/me` again.
- **Expected result:** Profile header shows that employee’s details. Row’s `userId` is now the signed-in user. Second load still works via `userId`.

### TC-20: Email match owned by another user

- **Priority:** High
- **Preconditions:** Auth user email equals an employee row whose `userId` is a different account.
- **Steps:**
  1. Open `/dashboard` as the unmatched auth user.
- **Expected result:** “No employee record linked to your account.” Row is not reassigned.

## Edge Cases & Error States

- Debounced search should not fire a request on every keystroke.
- Clearing search restores the full roster from page 1.
- Loading state shows “Loading employees…” on first list load and “Loading employee…” on detail / self profile.
- Missing department / phone / position on detail or self profile render as `—`.
- Self profile must not call list or get-by-id for another employee’s id.
- `/me` must not steal an employee row already linked to another `userId`.

## Out of Scope

- Division/department/status filters on the list.
- Tabs, edit, documents, evaluations, salary reveal.
- Avatar upload.
- Auto-creating `employee201.employee` rows on first login.
- Manager/admin roster access (still `super_admin` only).
- Profile-view audit POST.
