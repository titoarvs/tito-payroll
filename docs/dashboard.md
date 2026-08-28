# Dashboard shell

Authenticated app chrome for Tito Payroll. Dashboard home shows a welcome view with KPI metrics for payroll operators.

## Behavior

- After sign-in (password, MFA, or Google), users land on `/dashboard`.
- `/` redirects to `/dashboard` when signed in, otherwise `/sign-in`.
- **Topnav** (all signed-in roles): theme toggle, notifications button (UI only), user avatar with Sign out. Mobile hamburger opens nav sheet.
- **Sidenav** (payroll ops): Dashboard, Employees (`super_admin` only), Pay runs, Contribution tables, My payslips — icon + label.
- Non-ops employees see topnav only and their own profile header on dashboard home.
- Visiting `/dashboard/employees` redirects non-`super_admin` users to `/dashboard`.

### Dashboard home (`/dashboard`)

**Payroll ops** (`super_admin`, `admin`, `finance`):

- Personalized welcome line (`Welcome back, {firstName}`).
- **KPI row** (live counts from HRIS APIs):
  - **Employees** — total roster (`meta.total` from list); `super_admin` only; links to `/dashboard/employees`.
  - **Pay runs** — all cutoffs; links to `/dashboard/pay-runs`.
  - **Draft runs** — status `draft`.
  - **Computed** — status `computed`.
  - **Released** — status `released`.
  - **Contribution tables** — active schedule count; links to `/dashboard/contribution-tables`.
- **Quick actions** cards for Pay runs, Employees (`super_admin` only), and Contribution tables.

**Regular employees:** own `EmployeeDetailHeader` from `GET /employee201/employees/me` — see [employees.md](./employees.md).

## Routes

| Path | File | Notes |
| --- | --- | --- |
| `/dashboard` | `src/routes/dashboard.tsx` | Layout + session `beforeLoad` |
| `/dashboard/` | `src/routes/dashboard/index.tsx` | Welcome + KPIs (ops) or self profile |
| `/dashboard/employees` | `src/routes/dashboard/employees.tsx` | Roster; `super_admin` only |

## Components

- `src/components/layout/payroll-layout.tsx` — sidebar + header + main
- `src/components/layout/payroll-sidebar.tsx` — desktop sidenav
- `src/components/layout/payroll-header.tsx` — sticky top bar
- `src/components/dashboard/payroll-welcome-dashboard.tsx` — welcome + KPIs + quick actions
- `src/components/dashboard/dashboard-kpi-card.tsx` — metric tile

## Auth

- Session: HRIS JWT in `localStorage` via `hasHrisSession()`.
- Role checks are UI-only; API remains the security boundary.
