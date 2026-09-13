# Pay runs (cutoff compute)

Basic pay / gross / statutory deductions for a cutoff. Hours from Tito Clock (including approved OT, ND, and holiday work on compute). BIR withholding is out of scope this pass.

## Formula

- **Basic pay** = hourly rate × Clock hours (completed entries in the period)
- **Gross** = basic + employee **allowance (per cutoff)**
- **Adjustments** = overtime pay + night differential + holiday pay + other adjustment + 13th month (13th month is always `0.00` this pass)
- **1st cutoff**: HDMF + PhilHealth (if covered)
- **2nd cutoff**: SSS (if covered)
- **HMO**: never deducted
- **Consultants**: hours × rate only (no statutory); same My payslips access as employees
- **Net** = gross + adjustments − SSS − HDMF − PhilHealth

### Premium multipliers (named constants in API `compute-pay`)

| Component | Rate |
| --- | --- |
| Regular OT | **125%** of hourly × OT hours |
| Night differential | **10%** of hourly × ND hours |
| Holiday work | Holiday instance `premiumPercent` when present; otherwise **100%** of hourly × hours |

## Lifecycle

`draft` → `computed` (Compute) → `released` (Approve & release)

1. **Compute** replaces payslips for all active employees, snapshots identity (name, code, position, statutory IDs), pulls approved Clock OT/ND/holiday hours, and notifies payroll ops (`pay-run-computed`). Pending/rejected claims are ignored.
2. While **computed**, ops may `PATCH` payslip adjustment lines; totals recalculate server-side.
3. **Approve & release** sets `releasedBy` / `releasedAt`, stamps `preparedByName`, and notifies each linked employee (`payslip-released`). Slips appear under My payslips immediately — no email/file send.

## Routes

| Route | Who |
| --- | --- |
| `/dashboard/pay-runs` | finance / admin / super_admin — create via custom period date-range (calendar start/end) |
| `/dashboard/pay-runs/$id` | same — compute / edit adjustments / approve & release / paper preview / payslip grid (client pagination) |
| `/dashboard/contribution-tables` | same — edit SSS/HDMF/PhilHealth brackets |
| `/dashboard/my-payslips` | any signed-in employee/consultant with released slips |
| `/dashboard/my-payslips/$payslipId` | payslip details + print / save as PDF (`GET /api/payroll/payslips/:id`) |

## Layers

| Layer | Path |
| --- | --- |
| Service | `src/api-services/pay-runs.service.ts` |
| Types | `src/api-services/pay-runs.types.ts` |
| Queries | `src/queries/pay-runs.ts` |
| Hooks | `src/hooks/use-pay-runs.ts` |
| UI | `src/components/pay-runs/` — list/detail/my-payslips tables support **Columns** (show/hide + drag reorder; prefs in `localStorage`) |
| Notifications | `src/api-services/notifications.service.ts`, header bell |

## HRIS endpoints

- `GET/POST /api/payroll/pay-runs`
- `POST /api/payroll/pay-runs/:id/compute`
- `POST /api/payroll/pay-runs/:id/release`
- `GET /api/payroll/pay-runs/:id/payslips` — each row includes `employeeId` plus joined `employeeName` / `employeeCode` from employee201 (null if the employee row is missing).
- `PATCH /api/payroll/payslips/:id` (computed runs only; `payroll.pay_runs.release`)
- `GET /api/payroll/payslips/:id` — own released, or all if `payroll.payslips.view`; employee display fields when joined, plus department, position, employmentStatus, SSS/HDMF/PhilHealth/TIN numbers from employee201.
- `GET /api/payroll/payslips/me`
- `GET/PUT /api/payroll/contribution-schedules…`
- Notifications reuse `GET /api/employee201/notifications` (+ unread / mark-read)

Permissions: `payroll.*` for finance/admin/SA. Employees/consultants: `payroll.payslips.view_own` only. Guessable sibling payslip ids return **403**.

## Setup

1. Apply the new payroll payslip/pay-run migration on the target env (after schema push/generate for OT/ND/holiday/snapshot/`releasedBy` columns)
2. `npm run seed:rbac` in `tito-hris-api`
3. `npm run seed:contribution-schedules` — loads starter SSS / HDMF / PhilHealth brackets (required for Contribution tables UI and compute lookups)
4. Set employee hourly rate + optional allowance via **Salary rates** (`/dashboard/salary-rates`) — or T201 employment Job section
5. Optional for T201 bell deep-links: `VITE_PAYROLL_APP_URL` pointing at the payroll app origin

## Out of scope

- BIR withholding values
- 13th-month engine (column present, always zero)
- Email / SMTP delivery
- Clock WebSocket sync (compute is the sync)
- Granting `people_culture` payroll ops
- Stored PDF blobs / R2
- Configurable cutoff split (A-PR-01)
