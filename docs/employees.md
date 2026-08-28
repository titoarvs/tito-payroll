# Employees

Super-admin roster with **cards on small screens** and a **table inside a card on `md+`**. Search and 15-per-page pagination. Click a card or **Open** in the table to open that employee’s detail header.

Regular employees (`user` role, not `super_admin`) see **only their own** profile header on `/dashboard` via `GET /employee201/employees/me`. They never see the roster or another person’s detail page.

## Source of truth

Rows come from **tito-hris-api** PostgreSQL schema `employee201` (table `employee`), via the Nest list, get-by-id, and me endpoints below.

- Payroll does **not** call the T201 app or T201’s `tito_people` database.
- Local demo data: from `tito-hris-api/`, run `npm run seed:employees` (after `seed:users`) to populate `employee201.employee`.
- **Auth-originated stubs:** when a new auth user is created (Google SSO, email register, admin create-user, or invitation accept without an existing employee), HRIS `EmployeesService.ensureForAuthUser` creates a probationary `employee201.employee` stub with `employee.id` **and** `employee.userId` both equal to `auth.users.id`. If an unlinked employee already matches the login email, that row’s PK is kept and only `userId` is set. Role stays in auth/RBAC (`employee`); the 201 table has no role column.

## Behavior

### List

- Route `/dashboard/employees` is `super_admin` only (UI redirect). API still enforces `employee201.employees.view`.
- **Cards** (`md:hidden`): circular avatar, name, position, plus employee ID, department, status, hire date, and created date.
- **Table** (`hidden md:block`, wrapped in `Card`): columns Employee, Employee ID, Department, Position, Status, Hire date, Created, Actions (`Open` link). Sortable headers (asc/desc toggle) on Employee, Department, Position, Status, and Hire date via HRIS `sortBy` / `sortDir`.
- No share/bookmark icons, skill tags, or stats on the list.
- Search box (debounced ~300ms) filters by name, email, or employee code via HRIS `search`.
- Changing search resets to page 1.
- Pagination sits **below** the roster (table footer on desktop; below card grid on mobile): default **10** employees per page with a **Rows per page** selector (10, 20, 50, 100, 200); Previous / Page N of M / Next from `meta`.
- Table area scrolls inside the card (max height tied to viewport) with a sticky header; skeleton rows match the same layout while loading.

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
- Fresh Google / register users normally already have a stub from signup (`id` = `userId` = auth id), so `/me` should resolve without a 404.
- 404 when no employee row matches `userId` or email (legacy accounts created before stub-on-signup, or email owned by another user).
- Super-admin dashboard home stays empty; they use the Employees sidenav.

## Routes

| Path | File | Notes |
| --- | --- | --- |
| `/dashboard` | `src/routes/dashboard/index.tsx` | Self profile header for non-`super_admin` |
| `/dashboard/employees` | `src/routes/dashboard/employees.tsx` (layout) + `employees.index.tsx` | Card grid (mobile) + table in card (desktop) + search + pager (`super_admin` only) |
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

- `GET /api/employee201/employees?page=&limit=10&search=&sortBy=name&sortDir=asc`
  - Reads `employee201.employee`
  - Permission: `employee201.employees.view`
- `GET /api/employee201/employees/me`
  - Current user’s employee row via `userId`, else email match + auto-link when unlinked
  - Permission: `employee201.employees.view_own`
- `GET /api/employee201/employees/:id`
  - Returns `{ data: { accessLevel, employee, hasSalary, linkedUser }, message }`
  - Permission: `employee201.employees.view_own` (+ service IDOR)
  - Detail may include benefits flags (`withHmo`, coverage booleans). Salary/hourly amounts are never included — use audited reveal (see [payroll-source-data.md](./payroll-source-data.md)).

## Components

- `src/components/employees/employee-display.ts` — shared name / initials / photo helpers
- `src/components/employees/employee-card.tsx` — `EmployeeCard`, `EmployeeCardGrid` (cards are links; shown below `md`)
- `src/components/employees/employee-table.tsx` — `EmployeeTable` (table inside `Card`; shown at `md+`)
- `src/components/employees/employee-list-controls.tsx` — search input only
- `src/components/employees/employee-list-pagination.tsx` — range + pager (below roster)
- `src/components/employees/employee-roster-skeleton.tsx` — table/card loading skeletons
- `src/components/employees/employee-detail-header.tsx` — profile header matching the detail mock

## Notes

- HRIS list currently returns `userImage: null` for most rows; initials are the common case until photos are stored.
- “Employment Type” on the detail header maps to `employmentStatus` (no full-time/part-time column). `consultant` selects the Consultant pay branch (Hours × Rate).
- Salary is never typed or displayed on list, detail, or self profile.
