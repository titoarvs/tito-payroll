# Salary rates

Ops page to enter per-employee monthly salary, hourly rate, and optional allowance. Writes Clock `salary_rates` history and syncs the active values into employee201 for pay-run compute.

## Route

| Route | Who |
| --- | --- |
| `/dashboard/salary-rates` | finance / admin / super_admin (`requiresPayrollOps`) |

## Layers

| Layer | Path |
| --- | --- |
| Service | `src/api-services/salary-rates.service.ts` |
| Types | `src/api-services/salary-rates.types.ts` |
| Queries | `src/queries/salary-rates.ts` |
| Hooks | `src/hooks/use-salary-rates.ts` |
| UI | `src/components/salary-rates/salary-rates-page.tsx` |
| Helpers | `src/components/salary-rates/salary-rate-display.ts` |
| Route | `src/routes/dashboard/salary-rates.tsx` |
| Nav | `src/config/payroll-navigation.ts` — Organization → Salary rates |

## HRIS endpoints

| Method | Path | Permission |
| --- | --- | --- |
| `GET` | `/api/payroll/employees/:employeeId/salary-rates` | `payroll.salary_rates.view` |
| `POST` | `/api/payroll/employees/:employeeId/salary-rates` | `payroll.salary_rates.manage` |

**POST body** (money as decimal strings):

```json
{
  "monthlySalary": "50000.00",
  "hourlyRate": "284.09",
  "allowance": "1000.00",
  "effectiveFrom": "2026-08-01",
  "effectiveTo": null
}
```

**POST behavior:** create `clock.salary_rates` row; deactivate prior active rates for that `userId`; update employee201 `salary`, `hourlyRate`, `allowance`. Employee must have a linked `userId`.

Nest: `PayrollSalaryRatesController` / `PayrollSalaryRatesService` under `tito-hris-api/src/payroll/salary-rates/`.

## UI behavior

- **Two-pane layout:** searchable paginated employee list with avatars (left) + current pay summary, entry form, and history (right).
- Selection syncs to `?employeeId=` (deep-link from employee detail “Manage rates”).
- List uses the same HRIS page size options as Employees (default 10); search resets to page 1.
- Avatar uses `userImage` when it is an `http(s)` URL; otherwise initials.
- Form seeds from current employee201 pay; `effectiveFrom` defaults to today.
- Client validation for money decimals and date order before POST.
- Hourly is read-only and always computed as monthly ÷ 22 ÷ 8.
- Allowance is entered **per cutoff**; Current pay summary shows the **monthly** total (×2).
- No inline edit of history rows in v1.

## Setup

1. Deploy HRIS with payroll salary-rates controller.
2. `npm run seed:rbac` in `tito-hris-api` (adds `payroll.salary_rates.view` / `.manage` to payroll roles).
3. Open **Salary rates**, pick an employee with a linked account, save a rate.

## Out of scope

- Bulk CSV import
- Editing / deleting historical Clock rows
- Pay-run compute reading Clock history by date (uses synced employee201 fields)

## Related

- Design: [plans/2026-08-29-salary-rates-design.md](./plans/2026-08-29-salary-rates-design.md)
- Pay runs: [pay-runs.md](./pay-runs.md)
- QA: [qa/salary-rates.test-cases.md](./qa/salary-rates.test-cases.md)
