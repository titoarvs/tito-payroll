# Payroll source data (T201 / employee201)

Read-only clients for Basic Pay, deductions eligibility, leave treatment, and holiday premiums. Pay computation engines are not implemented yet.

## Source of truth

All data comes from **tito-hris-api** `employee201` (not the T201 app DB directly).

| Need | Endpoint | Notes |
| --- | --- | --- |
| Monthly salary + hourly rate | `POST /api/employee201/employees/:id/salary` `{ reason }` | Audited; returns `{ salary, hourlyRate }` strings. Requires `employee201.employees.salary.view` (+ grant for non–super_admin). |
| Employment / benefits flags | `GET /api/employee201/employees/:id` | `employmentStatus`, `withHmo`, `hmoProvider`, coverage booleans. **Never** returns salary/hourlyRate amounts. |
| Leave in cutoff | `GET /api/employee201/leave-requests?...` | Use `leaveTypeCode`, `isPaid`, `paidDays`, `unpaidDays`. `UNPAID` = LWOP (zero pay). |
| Holidays + premium % | `GET /api/employee201/holidays?from=&to=` | Confirmed active DOLE instances with `premiumPercent`. |

## Consultant routing (FR-PR-13)

When `employmentStatus === "consultant"`:

- Computation path: Hours × Rate only
- No statutory deductions, benefits, adjustments, or 13th month
- Coverage flags and HMO are forced off on create/update in HRIS

## HMO

`withHmo` / `hmoProvider` / `hmoMemberNumber` are **record-keeping only**. The deductions engine must never subtract HMO.

## Layers

| Layer | Path |
| --- | --- |
| Service | `src/api-services/payroll-source.service.ts` |
| Types | `src/api-services/payroll-source.types.ts` |
| Queries | `src/queries/payroll-source.ts` |
| Hooks | `src/hooks/use-payroll-source.ts` |

Hourly derivation (when HR leaves rate blank): `monthlySalary / 22 / 8`.

## Out of scope (this pass)

- Basic Pay / holiday premium / leave-pay / deductions engines
- Company SSS/Pag-IBIG/PhilHealth/tax tables
- ND-PR-13 balance-exceed payroll behavior
