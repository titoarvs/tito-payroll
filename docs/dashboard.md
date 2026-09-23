# Dashboard shell

Authenticated app chrome for Tito Payroll. Dashboard home shows a welcome view with KPI metrics for payroll operators.

## Behavior

- After sign-in (password, MFA, or Google), users land on `/dashboard`.
- `/` redirects to `/dashboard` when signed in, otherwise `/sign-in`.
- **Topnav** (all signed-in roles): theme toggle, notifications button (UI only), user avatar with Sign out. Mobile hamburger opens nav sheet.
- **Sidenav** (light chrome, reference layout): sectioned **General** / **Organization**, solid Tito-blue active pill (white label), footer copyright. Items: Dashboard; Employees / Salary rates / Pay runs / Contribution tables (ops); My payslips.
- Non-ops employees see topnav only and their own profile header on dashboard home.
- Visiting `/dashboard/employees` redirects non-`super_admin` users to `/dashboard`.

### Dashboard home (`/dashboard`)

**Payroll ops** (`super_admin`, `admin`, `finance`):

- Personalized welcome via shared `PageHeader` (`Welcome back, {firstName}`) with quick links to Employees / Pay runs.
- **Employee widgets** (`super_admin` only) from `GET /employee201/dashboard`:
  - KPI tiles: Total / Active / New / Inactive (`tito-widget`).
  - **By department** bar list widget.
- **Payroll KPI row** (live counts) as `tito-widget` tiles:
  - **Pay runs** — all cutoffs; links to `/dashboard/pay-runs`.
  - **Draft runs** — status `draft`.
  - **Computing** — status `computing` (interrupted / in-progress compute).
  - **Computed** — status `computed`.
  - **Released** — status `released`.
  - **Contribution tables** — active schedule count; links to `/dashboard/contribution-tables`.
- **Quick actions** as `tito-widget` tiles for Pay runs, Employees (`super_admin` only), and Contribution tables.

**Regular employees:** `EmployeeWelcomeDashboard` — welcome header, payslip KPI widgets, and latest-payslip widget. Profile/personal header cards are not shown on home (detail remains on `/dashboard/employees/$id` for ops).

## Routes

| Path | File | Notes |
| --- | --- | --- |
| `/dashboard` | `src/routes/dashboard.tsx` | Layout + session `beforeLoad` |
| `/dashboard/` | `src/routes/dashboard/index.tsx` | Welcome + KPIs (ops) or self profile |
| `/dashboard/employees` | `src/routes/dashboard/employees.tsx` | Roster; `super_admin` only |

## Components

- `src/components/layout/payroll-layout.tsx` — sidebar + header + main
- `src/components/layout/payroll-sidebar.tsx` — desktop sidenav (light, sectioned, solid active pill)
- `src/components/layout/payroll-nav-links.tsx` — shared sectioned nav links
- `src/components/layout/payroll-header.tsx` — sticky glass top bar (name + role)
- `src/components/layout/page-header.tsx` — page title + description + actions
- `src/components/dashboard/payroll-welcome-dashboard.tsx` — welcome + payroll KPIs + quick actions
- `src/components/dashboard/employee-dashboard-widgets.tsx` — HRIS employee dashboard KPIs + department widget
- `src/components/dashboard/employee-welcome-dashboard.tsx` — employee self home (payslip widgets + profile)
- `src/components/dashboard/dashboard-kpi-card.tsx` — tinted metric tile (`tito-widget`)

## Auth

- Session: HRIS JWT in `localStorage` via `hasHrisSession()`.
- Role checks are UI-only; API remains the security boundary.
