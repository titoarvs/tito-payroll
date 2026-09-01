# Salary rates — design

Validated 2026-08-29. Implementation follows `feature-workflow` + `payroll-hris-sync`.

## Decisions

| Topic | Choice |
| --- | --- |
| Surface | Dedicated page `/dashboard/salary-rates` (Organization nav, payroll ops) |
| Storage | Clock `salary_rates` history **and** sync active values to employee201 |
| Fields | Monthly salary + editable hourly + optional allowance |
| Dates | `effectiveFrom` required; `effectiveTo` optional; keep history |
| Money | Decimal strings only (no JS `number` for amounts) |

## Architecture

1. Ops user opens Salary rates, picks an employee with linked `userId`.
2. `GET` loads Clock rate history for that employee.
3. `POST` creates a Clock `salary_rates` row and syncs employee201 `salary`, `hourlyRate`, `allowance` in one transaction.
4. Pay runs continue to read employee201 rates (unchanged compute path).

Allowance exists only on employee201; Clock row stores monthly/hourly (+ derived daily for Clock columns).

## UI

- Full-width page shell (same horizontal spacing as Dashboard).
- Employee picker (search): name, code, department; block select if no `userId`.
- Selected panel: current active summary; add-rate form; history table (newest first).
- Form: monthly, hourly (prefill monthly÷22÷8, editable), optional allowance, effective from, optional effective to.
- v1: no inline edit of history rows — add a new rate to change pay.
- Loading skeletons, validation/403 inline errors, empty “pick an employee” state.

## API (HRIS)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/payroll/employees/:employeeId/salary-rates` | History (resolve employee → `userId` → Clock rows) |
| `POST` | `/api/payroll/employees/:employeeId/salary-rates` | Create Clock row + sync employee201 |

**POST body:** `{ monthlySalary, hourlyRate, allowance?, effectiveFrom, effectiveTo? }` (money as strings).

**POST rules:**

1. Employee must exist and have `userId` (else 400).
2. Insert `clock.salary_rates` with provided monthly/hourly; derive `dailyRate` from monthly ÷ 22.
3. New row `isActive=true`; previous active rates for that user → `isActive=false`.
4. Update employee201 `salary`, `hourlyRate`, `allowance`.
5. Return `{ data: { rate, employee } }` (ops roles only).

**Auth:** Nest `@Permissions` for payroll write / salary-rate create as appropriate. UI hide is not authorization.

**Errors:** invalid decimals → 400; `effectiveTo` before `from` → 400; not found → 404; forbidden → 403.

## Web layers

| Layer | Path |
| --- | --- |
| api-services | `src/api-services/salary-rates.service.ts` + `.types.ts` |
| queries | `src/queries/salary-rates.ts` |
| hooks | `src/hooks/use-salary-rates.ts` |
| UI | `src/components/salary-rates/` |
| route | `src/routes/dashboard/salary-rates.tsx` |
| nav | `payroll-navigation.ts` — Organization, `requiresPayrollOps` |

Reuse existing employees list/search for the picker (`useEmployees`).

## Docs / QA (same change)

- `docs/salary-rates.md`
- `docs/qa/salary-rates.test-cases.md`
- Update `docs/pay-runs.md` setup step (rates entered in Payroll Salary rates, not only T201)
- Update `docs/README.md` index

## Out of scope (v1)

- Inline edit / delete of historical rows
- Bulk CSV import
- Salary reveal audit UI on this page
- Changing pay-run compute to read Clock history by date (sync keeps employee201 current)

## Verify

```bash
pnpm typecheck && pnpm lint && pnpm build
```
