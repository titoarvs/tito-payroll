# Pay runs (cutoff compute)

**Batch** in product language is the `pay_run` table / HTTP `/api/payroll/pay-runs` (not renamed).

Basic pay / gross / statutory deductions / leave pay / withholding for a cutoff. Hours from Tito Clock (approved OT, ND, holiday). Approved T201 leave overlapping the period feeds leave pay. BIR withholding uses versioned tax tables (half of monthly tax each cutoff).

## Formula

- **Basic pay** = hourly rate × Clock hours (completed entries in the period)
- **Gross** = basic + employee **allowance (per cutoff)**
- **Adjustments** = overtime + night differential + holiday + **leave pay** + other adjustment + 13th month (13th month is always `0.00` this pass)
  - Leave pay = hourly × paid leave days in cutoff × 8 (consultants: `0`)
  - Unpaid / LWOP days add `0` leave pay (Clock hours are **not** reduced for LWOP — ND-PR-13 open)
- **Deductions** = SSS / HDMF / PhilHealth (cutoff split) + **withholding tax** (when covered, non-consultant)
  - Withholding = half of monthly TRAIN bracket tax for this cutoff
- **HMO**: never deducted
- **Consultants**: hours × rate only (no statutory / leave pay / tax)
- **Net** = gross + adjustments − SSS − HDMF − PhilHealth − withholding

### Premium multipliers (named constants in API `compute-pay`)

| Component | Rate |
| --- | --- |
| Regular OT | **125%** of hourly × OT hours |
| Night differential | **10%** of hourly × ND hours |
| Holiday work | Holiday instance `premiumPercent` when present; otherwise **100%** of hourly × hours |

## Core entities

| Concept | Storage |
| --- | --- |
| Batch | `payroll.pay_run` |
| Payslip | `payroll.payslip` (+ denormalized OT/ND/holiday/leave/tax columns) |
| Adjustment | `payroll.payslip_adjustment` lines (`overtime` / `night_diff` / `holiday` / `leave` / `other` / `thirteenth_month`); compute/PATCH dual-write lines + columns |
| TaxTable | `payroll.tax_schedule` + `payroll.tax_bracket` (versioned) |
| Contributions | `payroll.contribution_schedule` + brackets |

## Lifecycle

`draft` → `computed` (Compute) → `released` (Approve & release)

1. **Compute** replaces payslips for all active employees, snapshots identity, pulls Clock OT/ND/holiday, loads approved leave by `employee.id`, applies tax brackets, inserts adjustment rows, and notifies payroll ops.
2. While **computed**, ops may `PATCH` the **other** adjustment; leave + withholding stay compute-owned; totals recalculate server-side.
3. **Approve & release** stamps preparer and notifies each linked employee. Slips appear under My payslips immediately.

## Routes

| Route | Who |
| --- | --- |
| `/dashboard/pay-runs` | finance / admin — create; **super_admin** view-only (no create) |
| `/dashboard/pay-runs/$id` | finance / admin — compute / other adjustment / release; **super_admin** view-only |
| `/dashboard/contribution-tables` | finance / **super_admin** edit brackets; **admin** (HR) read-only |
| `/dashboard/tax-tables` | finance / **super_admin** edit brackets; **admin** (HR) read-only |
| `/dashboard/my-payslips` | any signed-in employee/consultant with released slips |
| `/dashboard/my-payslips/$payslipId` | payslip details + print / save as PDF |

### RBAC segregation of duties

| Role | Contribution / tax tables | Pay runs (create / compute / release / other adj.) |
| --- | --- | --- |
| `super_admin` | manage | view only |
| `admin` (HR) | view only | process |
| `finance` | manage | process |

UI helpers: `canManageStatutoryTables` / `canProcessPayRuns` in `src/lib/payroll-access.ts`. API enforces via `@Permissions` after `npm run seed:rbac`.

## Setup

1. Generate/apply payroll migrations in `tito-hris-api-v2` (`npm run db:generate` / `db:migrate`) — **not** run by agents
2. `npm run seed:rbac` (includes `payroll.tax_tables.view` / `manage`)
3. `npm run seed:contribution-schedules` and `npm run seed:tax-schedules`
4. Employee hourly rate + coverage flags in T201 / salary rates

## Out of scope

- Identity contract / BUG-TC-01
- Renaming `pay_run` → Batch in HTTP
- ND-PR-13 (subtract Clock hours for LWOP)
- Full BIR productization beyond versioned table + half-monthly apply
- 13th-month engine (column present, always zero)
- Email / SMTP delivery
