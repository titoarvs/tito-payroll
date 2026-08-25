# Pay runs (cutoff compute)

Basic Pay / Gross / statutory deductions for a cutoff. Hours from Tito Clock. BIR out of scope this pass.

## Formula

- **Basic Pay** = hourly rate × Clock hours (completed entries in period)
- **Gross** = Basic + employee **Allowance (per cutoff)**
- **1st cutoff**: HDMF + PhilHealth (if covered)
- **2nd cutoff**: SSS (if covered)
- **HMO**: never deducted
- **Consultants**: hours × rate only (no statutory)
- **Net** = Gross − SSS − HDMF − PhilHealth

## Routes

| Route | Who |
| --- | --- |
| `/dashboard/pay-runs` | finance / admin / super_admin |
| `/dashboard/pay-runs/$id` | same — compute / release / payslip grid |
| `/dashboard/contribution-tables` | same — edit SSS/HDMF/PhilHealth brackets |
| `/dashboard/my-payslips` | any signed-in employee with released slips |

## Layers

| Layer | Path |
| --- | --- |
| Service | `src/api-services/pay-runs.service.ts` |
| Types | `src/api-services/pay-runs.types.ts` |
| Queries | `src/queries/pay-runs.ts` |
| Hooks | `src/hooks/use-pay-runs.ts` |
| UI | `src/components/pay-runs/` |

## HRIS endpoints

- `GET/POST /api/payroll/pay-runs`
- `POST /api/payroll/pay-runs/:id/compute`
- `POST /api/payroll/pay-runs/:id/release`
- `GET /api/payroll/pay-runs/:id/payslips`
- `GET/PUT /api/payroll/contribution-schedules…`
- `GET /api/payroll/payslips/me`

Permissions: `payroll.*` (finance/admin/SA). Employees: `payroll.payslips.view_own` only.

## Setup

1. Apply migrations `0014_employee_allowance`, `0015_payroll_cutoff_compute` on HRIS
2. `npm run seed:rbac` in `tito-hris-api`
3. Set employee hourly rate + optional allowance (T201 employment Job section)

## Out of scope

- BIR withholding
- OT / holiday / leave pay engines
- Payslip PDF
- Configurable cutoff split (A-PR-01)
