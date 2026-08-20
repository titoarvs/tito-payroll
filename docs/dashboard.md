# Dashboard shell

Authenticated app chrome for Tito Payroll. Dashboard home is still empty; Employees has a card roster for `super_admin`.

## Behavior

- After sign-in (password, MFA, or Google), users land on `/dashboard`.
- `/` redirects to `/dashboard` when signed in, otherwise `/sign-in`.
- **Topnav** (all signed-in roles): title “Payroll”, theme toggle (Light / Dark / System), notifications button (UI only), user avatar with Sign out.
- **Sidenav** (`super_admin` only): Dashboard and Employees with icon + label.
- Non-`super_admin` users see topnav only. Visiting `/dashboard/employees` redirects to `/dashboard`.
- Dashboard home main area is empty. Employees page shows searchable profile cards — see [employees.md](./employees.md).

## Routes

| Path | File | Notes |
| --- | --- | --- |
| `/dashboard` | `src/routes/dashboard.tsx` | Layout + session `beforeLoad` |
| `/dashboard/` | `src/routes/dashboard/index.tsx` | Empty home |
| `/dashboard/employees` | `src/routes/dashboard/employees.tsx` | Card grid; `super_admin` only |

## Components

- `src/components/layout/app-shell.tsx` — sidenav + topnav; uses `useCurrentUser` / `useLogout`; mounts `ModeToggle`.

## Auth

- Session: `hasHrisSession()` (HRIS JWT in `localStorage`).
- Role: `user.role === "super_admin"` or `user.roles` includes `"super_admin"` (UI only; API remains the security boundary for data).
