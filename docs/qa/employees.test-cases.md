# Employees — QA Test Cases

## Overview

Super-admin employee roster with search and paginated results (default 10 per page; selectable 10, 20, 50, 100, 200). Mobile shows profile cards; desktop (`md+`) shows a table inside a card. Click a card or **Open** to open the employee detail header.

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

### TC-01: Super admin sees employee cards and table

- **Priority:** High
- **Preconditions:** Signed in as `super_admin`; employees exist in HRIS.
- **Steps:**
  1. Open `/dashboard/employees` on a viewport below `md`.
  2. Widen the viewport to `md` or above.
- **Expected result:** Below `md`: cards show avatar (or initials), name, position, employee ID, department, status, hire date, and created date (at most 10 by default). At `md+`: a bordered table in a card lists Employee, Employee ID, Department, Position, Status, Hire date, Created, and Open. **Columns** control is visible on desktop.

### TC-01b: Columns show/hide and reorder

- **Priority:** Medium
- **Preconditions:** Desktop employees roster with rows.
- **Steps:**
  1. Click **Columns**.
  2. Hide Department; drag Status above Position.
  3. Refresh the page.
- **Expected result:** Department column gone; Status appears before Position; preference persists after refresh. Employee and Actions remain.

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
- **Expected result:** Roster updates to matching employees (cards and/or table). Range text reflects filtered total.

### TC-04: Search with no matches

- **Priority:** Medium
- **Preconditions:** Signed in as `super_admin`.
- **Steps:**
  1. Search for a string that matches no employee.
- **Expected result:** Message “No employees match your search.” Pager shows “No results”.

### TC-05: Search resets to page 1

- **Priority:** Medium
- **Preconditions:** More than 10 employees; on page 2+.
- **Steps:**
  1. Go to page 2.
  2. Enter a search term.
- **Expected result:** After debounce, page indicator is page 1 of the filtered result set.

### TC-06: Pagination — default 10 per page

- **Priority:** High
- **Preconditions:** At least 11 employees; empty search.
- **Steps:**
  1. Open Employees.
  2. Click Next.
  3. Click Previous.
- **Expected result:** Page 1 shows up to 10 rows/cards. Next loads page 2. Previous returns to page 1. Range text like `1–10 of N` then `11–… of N`.

### TC-06b: Page size selector

- **Priority:** Medium
- **Preconditions:** At least 11 employees; empty search.
- **Steps:**
  1. Open Employees (default 10 per page).
  2. Change **Rows per page** to 20, then 50, 100, and 200.
- **Expected result:** Each change resets to page 1 and refetches with the selected limit. Options are 10, 20, 50, 100, and 200 only.

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

### TC-11: Open employee detail from card or table

- **Priority:** High
- **Preconditions:** Signed in as `super_admin`; at least one employee on the list.
- **Steps:**
  1. Open `/dashboard/employees` below `md` and click an employee card.
  2. Widen to `md+` and click **Open** / **View** on a table row.
- **Expected result:** Navigates to `/dashboard/employees/<id>`. Three-card layout: profile (avatar, name, code chip, Active/Inactive, employment type, join date), personal info + benefits, and pay snapshot (or empty/unavailable). “Back to employees” link is visible.

### TC-12: Detail field mapping + pay snapshot

- **Priority:** High
- **Preconditions:** Known employee with department, employment status, email, phone; preferably a salary rate on file.
- **Steps:**
  1. Open that employee’s detail page.
- **Expected result:** Profile shows name, position, department, code, status pill. Personal card shows email/phone/civil status and benefits coverage. Pay snapshot shows monthly/hourly/allowance when rates exist (ops with `payroll.salary_rates.view`); “Manage rates” goes to Salary rates. Below the cards, a **Salary rate history** table lists From / To / Monthly / Hourly / Status (or empty state). No salary amounts on the list route. No three-dot menu.

### TC-12b: Pay snapshot permission / unlinked

- **Priority:** Medium
- **Preconditions:** Ops without salary-rates view, or employee without linked `userId`.
- **Steps:**
  1. Open detail for that employee / role.
- **Expected result:** Without permission, pay card and rate history table are hidden. Unlinked account shows a clear message on both; profile/personal cards still render.

### TC-12c: Salary rate history table

- **Priority:** High
- **Preconditions:** Employee with one or more Clock salary rates; ops with `payroll.salary_rates.view`.
- **Steps:**
  1. Open `/dashboard/employees/<id>`.
  2. Scroll below the three cards.
  3. Click **Manage rates** in the history card header.
- **Expected result:** Table shows rate rows newest-first with money as formatted currency and Active/Inactive. CTA opens `/dashboard/salary-rates?employeeId=<id>`.

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

### TC-16: Employee sees payslip welcome widgets on dashboard

- **Priority:** High
- **Preconditions:** Signed in as non-ops employee.
- **Steps:**
  1. Open `/dashboard` (or land there after sign-in).
- **Expected result:** `EmployeeWelcomeDashboard` shows welcome header, payslip KPI widgets, and latest-payslip widget. No profile/personal `EmployeeDetailHeader`. No pay snapshot. No “Back to employees”. No Employees sidenav. No salary amounts.

### TC-17: Employee dashboard without linked employee record

- **Priority:** Medium
- **Preconditions:** Signed in as non-ops with no `employee.userId` link **and** login email does not match any `employee.email` (legacy account).
- **Steps:**
  1. Open `/dashboard`.
- **Expected result:** Payslip welcome widgets still render (empty/zero payslips). No “No employee record linked” banner. Still no Employees sidenav/roster.

### TC-17b: Fresh Google / register creates employee201 stub

- **Priority:** High
- **Preconditions:** Brand-new Google (or register) account that did not exist in `auth.users` or `employee201.employee`.
- **Steps:**
  1. Sign in to payroll with Google (or complete register).
  2. As that user, open `/dashboard`.
  3. As a `super_admin`, open `/dashboard/employees` and search the new user’s email/name.
- **Expected result:** Welcome payslip widgets appear (not a missing-employee error). New stub is `probationary`. In HRIS DB, `employee.id` and `employee.userId` both equal the new `auth.users.id`. Super-admin roster includes the stub.

### TC-18: Super-admin dashboard has no self-profile header

- **Priority:** Medium
- **Preconditions:** Signed in as `super_admin`.
- **Steps:**
  1. Open `/dashboard`.
- **Expected result:** Ops welcome dashboard with employee widgets + payroll KPIs (no self `EmployeeDetailHeader`). Employees available via sidenav.

### TC-19: Email match auto-links unlinked employee row

- **Priority:** High
- **Preconditions:** Auth user email equals an `employee201.employee.email` whose `userId` is null. Signed in as that non-ops user.
- **Steps:**
  1. Call `GET /api/employee201/employees/me` (or open an HRIS client that uses `/me`).
  2. Optionally call `/me` again.
- **Expected result:** Response returns that employee’s details. Row’s `userId` is now the signed-in user. Second load still works via `userId`. Dashboard home does not show the profile header.

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
- Tabs, edit, documents, evaluations, leave/performance charts.
- Audited salary reveal POST on the detail page (pay snapshot uses salary-rates instead).
- Avatar upload.
- Auto-creating `employee201.employee` rows on first login.
- Manager/admin roster access (still `super_admin` only).
- Profile-view audit POST.
