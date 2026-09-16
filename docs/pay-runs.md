# Pay runs (cutoff compute)

**Batch** in product language is the `pay_run` table / HTTP `/api/payroll/pay-runs` (not renamed).

Basic pay / gross / statutory deductions / withholding for a cutoff. Hours from Tito Clock (plus restored paid-leave gap). Approved OT, ND, holiday claims are adjustments. BIR withholding uses versioned tax tables on (Gross − contributions).

## Formula

- **Basic pay** = hourly rate × (Clock hours + restored paid-leave hours)
  - Restored hours = per paid-leave weekday, `max(0, expected − Clock hours that day)` (full day 8h / AM–PM 4h)
  - Unpaid / LWOP does **not** reduce Clock hours (ND-PR-13 open); consultants restore `0`
- **Gross** = basic + employee **allowance (per cutoff)** (consultants: Gross = Basic only)
- **Adjustments** = overtime + night differential + holiday + other adjustment + 13th month
  - Paid leave is **not** an additive line (`leavePay` stays `0.00`; amount is already in Basic)
  - 13th month = `1/12` of year-to-date Basic when the batch has `includeThirteenthMonth`; otherwise `0.00`
- **Deductions** = SSS / HDMF / PhilHealth (cutoff split) + **withholding tax** (when covered, non-consultant)
  - Taxable cutoff = `max(0, Gross − SSS − HDMF − PhilHealth)`
  - Withholding = half of monthly TRAIN tax on `(taxable cutoff × 2)`
- **HMO**: never deducted
- **Consultants**: Net = Hours × Rate only — no allowance, statutory, leave restore, tax, OT/ND/holiday premiums, other adjustment, or 13th month
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
| Batch | `payroll.pay_run` (`includeThirteenthMonth` flag) |
| Payslip | `payroll.payslip` (+ denormalized OT/ND/holiday/leave/tax columns) |
| Adjustment | `payroll.payslip_adjustment` lines (`overtime` / `night_diff` / `holiday` / `leave` / `other` / `thirteenth_month`); compute/PATCH dual-write lines + columns |
| TaxTable | `payroll.tax_schedule` + `payroll.tax_bracket` (versioned) |
| Contributions | `payroll.contribution_schedule` + brackets |

## Lifecycle

`draft` → `computed` (Compute) → `released` (Approve & release)

1. **Compute** replaces payslips for all active employees, snapshots identity, pulls Clock OT/ND/holiday (skipped for consultants), restores paid-leave hours into Basic (non-consultants), loads approved leave by `employee.id`, applies tax from Gross − contributions, fills 13th month when the batch is flagged, inserts adjustment rows, and notifies payroll ops.
2. While **computed**, ops may `PATCH` the **other** adjustment with a **required reason** (non-consultants only); leave restore + withholding stay compute-owned; totals recalculate server-side; change is audit-logged under module `payroll`.
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
- Automatic December 13th-month payout (HR flags the batch instead)
- Subtracting 13th month already paid earlier in the same year
- Email / SMTP delivery
