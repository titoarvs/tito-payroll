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

| Component          | Rate                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------ |
| Regular OT         | **125%** of hourly × OT hours                                                        |
| Night differential | **10%** of hourly × ND hours                                                         |
| Holiday work       | Holiday instance `premiumPercent` when present; otherwise **100%** of hourly × hours |

## Core entities

| Concept       | Storage                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Batch         | `payroll.pay_run` (`kind` regular/correction, `correctsPayRunId`, `includeThirteenthMonth`, pinned `taxScheduleId` / `sssScheduleId` / `hdmfScheduleId` / `philhealthScheduleId`) |
| Payslip       | `payroll.payslip` (+ denormalized OT/ND/holiday/leave/tax columns; SSS/HDMF/PhilHealth/TIN **and money fields** AES-GCM at rest) |
| Adjustment    | `payroll.payslip_adjustment` lines (`overtime` / `night_diff` / `holiday` / `leave` / `other` / `thirteenth_month`); amounts encrypted; compute/PATCH dual-write lines + columns |
| Hold          | `payroll.pay_run_adjustment_hold` — snapshots other-adjustments (and correction membership) across compute / resume |
| TaxTable      | `payroll.tax_schedule` + `payroll.tax_bracket` (versioned; fork on edit if pinned)                                                                                                |
| Contributions | `payroll.contribution_schedule` + brackets (fork on edit if pinned)                                                                                                               |
| Audit         | `employee201.audit_log` (append-only + DB trigger; create/compute/release/PATCH + payslip views with IP / user-agent; no amounts in the log) |

## Lifecycle

`draft` → `computing` (Compute / Resume) → `computed` → `released` (Approve & release)

1. **Readiness** (`GET /api/payroll/pay-runs/:id/readiness`) lists active employees missing an hourly rate or Tito Clock `userId`. Correction batches return no issues.
2. **Compute** on a regular run is **blocked** (409) when readiness issues exist; payroll ops get a one-shot `pay-run-missing-data` notification. When clean, status becomes `computing` and each employee is written in its own DB transaction (encrypted payslip + adjustment lines). Employees already written are skipped on **Resume**. When every employee has a slip, status becomes `computed`, holds clear, and ops get `pay-run-computed`. A full recompute from `computed` first snapshots other-adjustments into `pay_run_adjustment_hold`, deletes slips, then recomputes and reapplies those holds.
3. While **computed**, ops may `PATCH` the **other** adjustment with a **required reason** (non-consultants only); leave restore + withholding stay compute-owned; totals recalculate server-side; payslip + adjustments + audit share one DB transaction under module `payroll`. PATCH / release require `computed` (not `computing`).
4. **Approve & release** stamps preparer and notifies each linked employee (atomic with audit). Slips appear under My payslips immediately. Viewing a payslip (`GET .../payslips/:id`), My payslips, ops list, or pay-run payslip list writes a `view` audit row with actor IP / user-agent and **null** old/new values (no statutory numbers or money amounts).
5. **Approval reminders** (daily 8 AM Asia/Manila, or `POST /api/payroll/scan-alerts`): for `status=computed`, due date = cutoff `periodEnd`. Stages: 7 days before → `pay-run-approval-reminder-7`; 2 days before → `pay-run-approval-reminder-2`; on/after `periodEnd` → `pay-run-approval-overdue`. Each stage once per pay run (in-app only). No reminders while `computing`.
6. **Unfiled holiday work reminders** (same cron / `scan-alerts`): current calendar cutoff (1–15 / 16–EOM). When an employee has completed Clock work on a confirmed T201 holiday date with no approved Holiday Work claim, they get one in-app `holiday-work-unfiled-reminder` (payroll bell → `/dashboard`). Skips consultants, unlinked employees, closed cutoffs, and released regular pay runs for that period. Dedupe once per user × cutoff start × holiday date.
7. **Table edits after compute**: Saving brackets on a schedule already pinned by any pay run **forks** a new schedule version (old row closed). Issued payslip amounts stay frozen; detail shows truncated pinned schedule ids.

### Correction batches (post-approval)

After a **regular** run is released, HR/finance may create a **correction** batch instead of editing the source.

1. On the released source detail → **Create correction** → pick one or more non-consultant employees → `POST /api/payroll/pay-runs/:id/corrections`.
2. New draft has `kind=correction`, `correctsPayRunId` = source id, same period/cutoff; zeroed payslips (identity copied from source).
3. **Compute** re-zeros money from the source identity (no Clock / statutory / tax / 13th).
4. **PATCH other adjustment** (reason required) is the only writable money line; OT/ND/holiday/13th overrides are rejected.
5. **Approve & release** stamps the **correction** run only. Source `releasedBy` / `releasedAt` / amounts stay unchanged.
6. Employees see an extra slip under My payslips.

UI: list shows a **Correction** badge; detail links back to the source run.

## Routes

| Route                               | Who                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard/pay-runs`               | finance / admin — create; **super_admin** view-only (no create)                                                             |
| `/dashboard/pay-runs/$id`           | finance / admin — compute / other adjustment / release / create correction from released regular; **super_admin** view-only |
| `/dashboard/contribution-tables`    | finance / **super_admin** edit brackets; **admin** (HR) read-only                                                           |
| `/dashboard/tax-tables`             | finance / **super_admin** add / edit / delete draft brackets, import CSV, publish; **admin** (HR) read-only                 |
| `/dashboard/my-payslips`            | any signed-in employee/consultant with released slips                                                                       |
| `/dashboard/my-payslips/$payslipId` | payslip details + print / save as PDF                                                                                       |

### Tax tables (draft + frequency)

- Route: `src/routes/dashboard/tax-tables.tsx` → `TaxTablesPage`
- Hooks: `useTaxSchedules`, `useAddDraftTaxBracket`, `useUpdateDraftTaxBracket`, `useDeleteDraftTaxBracket`, `useImportDraftTaxBrackets`, `usePublishTaxDraft`, `useReplaceTaxBrackets`
- Endpoints:
  - `GET /api/payroll/tax-schedules`
  - `POST /api/payroll/tax-schedules/draft/brackets` — frequency, sequence, min, max (null = open), base tax, rate %, excess-over; creates draft if missing; does not change the active schedule
  - `PATCH /api/payroll/tax-schedules/draft/brackets/:bracketId` — edit one draft bracket only; 400 if the bracket is on a published schedule
  - `DELETE /api/payroll/tax-schedules/draft/brackets/:bracketId` — delete one draft bracket only
  - `POST /api/payroll/tax-schedules/draft/import` — body `{ csv }` with header `frequency,sequence,minCompensation,maxCompensation,baseTax,rateOnExcess,excessOver`; replaces all brackets on the draft (creates draft if missing); does not publish or change the active schedule; invalid CSV → 400 with no writes
  - `POST /api/payroll/tax-schedules/draft/publish` — promotes draft to active; deactivates prior active (pinned pay runs keep their schedule id)
- Formula: `withholding = baseTax + rate% × max(0, taxable − excessOver)`. Semi-monthly brackets on the **active** schedule apply directly to cutoff taxable; monthly-only schedules keep the legacy ×2 / half-of-monthly TRAIN path.
- Migration: `0042_payroll_tax_draft_brackets.sql` (`status`, `frequency`, `sequence`, `excess_over`)

### T201 employee Payslips tab

- `GET /api/payroll/employees/:employeeId/payslips` (`payroll.payslips.view`) — released slips for one employee; used by the T201 profile Payslips tab (Nest `admin` / `super_admin` only). Employees use My payslips here, not T201.

### RBAC segregation of duties

| Role          | Contribution / tax tables | Pay runs (create / compute / release / other adj.) |
| ------------- | ------------------------- | -------------------------------------------------- |
| `super_admin` | manage                    | view only                                          |
| `admin` (HR)  | view only                 | process                                            |
| `finance`     | manage                    | process                                            |

UI helpers: `canManageStatutoryTables` / `canProcessPayRuns` in `src/lib/payroll-access.ts`. API enforces via `@Permissions` after `npm run seed:rbac`.

## Setup

1. Apply payroll migrations in `tito-hris-api` (`npm run db:migrate`) — include `0031_payroll_audit_pii_versions.sql`, `0035_payroll_tax_correction_thirteenth.sql`, `0036_payroll_payslip_money_encrypt_resume.sql`, and `0042_payroll_tax_draft_brackets.sql`. **Not** run by agents. Missing `kind` / schedule columns on `payroll.pay_run` makes `GET /api/payroll/pay-runs` return 500.
2. Set `PII_ENCRYPTION_KEY` to exactly 32 characters in Infisical / `.env` (AES-256-GCM for SSS/HDMF/PhilHealth/TIN **and** payslip money). Do **not** reuse `MFA_ENCRYPTION_KEY`. Legacy plain decimals remain readable until the next write encrypts them.
3. `npm run seed:rbac` (includes `payroll.tax_tables.view` / `manage`)
4. `npm run seed:contribution-schedules` and `npm run seed:tax-schedules`
5. Employee hourly rate + coverage flags in T201 / salary rates

Production TLS terminates at the reverse proxy; Helmet is enabled on the API. Page-activity logs no longer store HTTP response bodies. Dashboard / 13th-month totals decrypt money rows in the API (SQL `SUM` cannot run on ciphertext).

## Out of scope

- Identity contract / BUG-TC-01
- Renaming `pay_run` → Batch in HTTP
- ND-PR-13 (subtract Clock hours for LWOP)
- Full BIR productization beyond versioned table + half-monthly apply
- Automatic December 13th-month payout (HR flags the batch instead)
- Subtracting 13th month already paid earlier in the same year
- Email / SMTP delivery
- Approval overdue email escalation (in-app notifications only)
