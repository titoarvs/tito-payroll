# Employees

Super-admin roster as profile cards (avatar, name, position). Search and 15-per-page pagination. Click a card to open that employee’s detail header.

Regular employees (`user` role, not `super_admin`) see **only their own** profile header on `/dashboard` via `GET /employee201/employees/me`. They never see the roster or another person’s detail page.

## Source of truth

Rows come from **tito-hris-api** PostgreSQL schema `employee201` (table `employee`), via the Nest list, get-by-id, and me endpoints below.

- Payroll does **not** call the T201 app or T201’s `tito_people` database.
- Local demo data: from `tito-hris-api/`, run `npm run seed:employees` (after `seed:users`) to populate `employee201.employee`.

## Behavior

### List

- Route `/dashboard/employees` is `super_admin` only (UI redirect). API still enforces `employee201.employees.view`.
- Cards show circular avatar (photo if `userImage` is an `http(s)` URL, else initials), full name, and position (or em dash).
- Cards link to `/dashboard/employees/$id`.
- No action buttons, share/bookmark icons, skill tags, or stats on the list.
- Search box (debounced ~300ms) filters by name, email, or employee code via HRIS `search`.
- Changing search resets to page 1.
- Pagination: 15 employees per page; Previous / Page N of M / Next from `meta`.

### Detail (super_admin)

- Route `/dashboard/employees/$id` is `super_admin` only (same UI redirect). API enforces `employee201.employees.view_own` + IDOR.
- Header only: cover banner, overlapping avatar, name, `#employeeCode • position`, Active/Inactive pill, four info cards (department, employment status as “Employment Type”, email, phone).
- Avatar uses `linkedUser.image` when it is an `http(s)` URL; otherwise initials.
- Missing fields show `—`. Salary is never shown.
- Back link returns to `/dashboard/employees`.

### Self profile (employee / `user`)

- Route `/dashboard` shows `EmployeeDetailHeader` for the signed-in non-`super_admin` user.
- Data from `GET /api/employee201/employees/me` (`useMyEmployee`).
- Photo from current user (`/users/me` image) passed as `linkedUser`; `/me` does not return `linkedUser`.
- No “Back to employees”, no sidenav Employees link, no roster.
- `/me` resolves the row by `employee.userId` first; if missing, by matching login email to `employee.email`. Unlinked email matches are auto-linked (`userId` set). Email match already owned by another user → treated as not found.
- 404 when no employee row matches `userId` or email.
- Super-admin dashboard home stays empty; they use the Employees sidenav.

## Routes

| Path | File | Notes |
| --- | --- | --- |
| `/dashboard` | `src/routes/dashboard/index.tsx` | Self profile header for non-`super_admin` |
| `/dashboard/employees` | `src/routes/dashboard/employees.tsx` (layout) + `employees.index.tsx` | Card grid + search + pager (`super_admin` only) |
| `/dashboard/employees/$id` | `src/routes/dashboard/employees.$id.tsx` | Detail header (`super_admin` only) |

`employees.tsx` is a layout with `<Outlet />` so the `$id` child can render. List UI lives in `employees.index.tsx`.

## Layers

| Layer | Path |
| --- | --- |
| Hook | `useEmployees` / `useEmployee` / `useMyEmployee` — `src/hooks/use-employees.ts` |
| Debounce | `useDebouncedValue` — `src/hooks/use-debounced-value.ts` |
| Query | `getEmployeesQuery` / `getEmployeeQuery` / `getMyEmployeeQuery` / `employeesKeys` — `src/queries/employees.ts` |
| Service | `employeesService.list` / `employeesService.getById` / `employeesService.getMe` — `src/api-services/employees.service.ts` |
| Types | `src/api-services/employees.types.ts` |

## HRIS endpoints

- `GET /api/employee201/employees?page=&limit=15&search=&sortBy=name&sortDir=asc`
  - Reads `employee201.employee`
  - Permission: `employee201.employees.view`
- `GET /api/employee201/employees/me`
  - Current user’s employee row via `userId`, else email match + auto-link when unlinked
  - Permission: `employee201.employees.view_own`
- `GET /api/employee201/employees/:id`
  - Returns `{ data: { accessLevel, employee, hasSalary, linkedUser }, message }`
  - Permission: `employee201.employees.view_own` (+ service IDOR)

## Components

- `src/components/employees/employee-card.tsx` — `EmployeeCard`, `EmployeeCardGrid` (cards are links)
- `src/components/employees/employee-list-controls.tsx` — search + pagination controls
- `src/components/employees/employee-detail-header.tsx` — profile header matching the detail mock

## Notes

- HRIS list currently returns `userImage: null` for most rows; initials are the common case until photos are stored.
- “Employment Type” on the detail header maps to `employmentStatus` (no full-time/part-time column).
- Salary is never typed or displayed on list, detail, or self profile.
