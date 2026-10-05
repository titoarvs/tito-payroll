# Pay runs — QA Test Cases

## Overview

Cutoff create → compute → review → approve & release. Contribution table edits. Paper My payslips + notifications.

- Routes: `/dashboard/pay-runs`, `/dashboard/pay-runs/$id`, `/dashboard/contribution-tables`, `/dashboard/my-payslips`, `/dashboard/my-payslips/$payslipId`
- Hooks: `usePayRuns`, `useComputePayRun`, `useReleasePayRun`, `useUpdatePayslip`, `useContributionSchedules`, `useMyPayslips`, `usePayslip`

## Prerequisites

- Latest payroll schema migration applied (payslip snapshot + OT/ND/holiday/adjustment columns; pay run `releasedBy` / `releasedAt`); `npm run seed:rbac`
- Finance/admin JWT for pay-run ops; employee/consultant JWT for My payslips
- Active employee with `userId` linked to Clock, hourly rate set, optional allowance
- At least one approved OT and/or ND and/or holiday-work claim in the cutoff window (for premium cases)
- Seeded SSS/HDMF/PhilHealth schedules

## Test Cases

### TC-01: Basic pay = hourly × Clock hours

- **Priority:** High
- **Preconditions:** Employee hourly rate `100.00`; 8 hours of completed Clock entries in period
- **Steps:** Create 2nd-half pay run for that date range → Compute
- **Expected result:** Payslip `basicPay` = `800.00`; `hoursWorked` = `8.00`

### TC-02: Gross = basic + allowance

- **Priority:** High
- **Preconditions:** Allowance (per cutoff) = `150.00` on employee
- **Steps:** Compute pay run
- **Expected result:** `grossPay` = basic + `150.00`

### TC-03: 1st cutoff deducts HDMF + PhilHealth, not SSS

- **Priority:** High
- **Steps:** Create pay run with `cutoffHalf=first` → Compute
- **Expected result:** `hdmf` and `philhealth` from tables (if covered); `sss` = `0.00`; no HMO field

### TC-04: 2nd cutoff deducts SSS only

- **Priority:** High
- **Steps:** Create pay run with `cutoffHalf=second` → Compute
- **Expected result:** `sss` from table; `hdmf`/`philhealth` = `0.00`

### TC-05: Coverage flags skip fund

- **Priority:** High
- **Preconditions:** `pagibigCovered=false`
- **Steps:** 1st cutoff compute
- **Expected result:** `hdmf` = `0.00`

### TC-06: Consultant — hours × rate only; same self-access

- **Priority:** High
- **Preconditions:** `employmentStatus=consultant`; linked user; employee may have allowance and approved OT/ND/holiday claims
- **Steps:** Compute → Approve & release → open My payslips as consultant
- **Expected result:** Gross = Basic = Hours × Rate (allowance ignored); all statutory `0.00`; OT/ND/holiday/other/13th `0.00`; paper slip visible; other employees' ids return 403; other-adjustment editor hidden; PATCH adjustment → 400

### TC-07: Unlinked Clock user blocks regular compute

- **Priority:** High
- **Preconditions:** At least one active employee with `userId` null (or no hourly rate)
- **Steps:** Open draft regular pay run → note readiness banner → Compute
- **Expected result:** Compute returns 409 with `issues` listing the employee; no payslips written; ops receive `pay-run-missing-data` once; payroll bell links to pay-run detail. Correction compute still succeeds with empty readiness.

### TC-07b: Ready employees allow compute

- **Priority:** High
- **Preconditions:** All active employees have `userId` and positive hourly rate
- **Steps:** Compute
- **Expected result:** Compute succeeds; readiness issues empty

### TC-07c: Approval reminders escalate on periodEnd

- **Priority:** High
- **Preconditions:** Computed (unreleased) pay run with known `periodEnd`
- **Steps:**
  1. `POST /api/payroll/scan-alerts` with `today` = periodEnd − 7 days
  2. Same with periodEnd − 2 days
  3. Same with periodEnd (or later)
  4. Repeat step 3
  5. Release the run; scan again
- **Expected result:** Steps 1–3 create `pay-run-approval-reminder-7`, `-2`, and `pay-run-approval-overdue` for payroll ops (once each) under `data.approval`. Step 4 creates no duplicates. Step 5 creates nothing new for that run. Regular employees do not see these types. Pay-runs list shows “Release due in N days” / “Approval overdue” on computed rows.

### TC-07d: Unfiled holiday work reminds employee before cutoff closes

- **Priority:** High
- **Preconditions:** Current cutoff still open; confirmed active T201 `holiday_instance` in the cutoff; non-consultant employee with linked Clock `userId` has a completed time entry on that holiday date; no approved `holiday_hours` for that user+date; no released regular pay run for the cutoff
- **Steps:**
  1. As finance/admin, `POST /api/payroll/scan-alerts` with `today` inside the cutoff
  2. Repeat the same scan
  3. Sign in as the employee; open tito-payroll notification bell (and T201 bell if `VITE_PAYROLL_APP_URL` is set)
  4. Scan again with `today` after cutoff `periodEnd`
  5. Repeat with a consultant who also logged holiday work without a claim
- **Expected result:** Step 1 creates one `holiday-work-unfiled-reminder` for the employee (`data.holidayWork.created` ≥ 1). Step 2 creates no duplicate for the same user × holiday date. Step 3 shows the reminder (title “File holiday work before cutoff”); payroll bell links to `/dashboard`; approval/staff types stay hidden from the employee. Step 4 creates no new holiday reminders. Step 5 does not notify the consultant.

### TC-08: Compute pulls approved OT / ND / holiday only

- **Priority:** High
- **Preconditions:** Approved OT 2h; pending OT 3h; approved ND 4h; approved holiday work with premium
- **Steps:** Compute
- **Expected result:** OT hours/pay use approved 2h at 125%; ND at 10%; holiday uses instance premium (else 100%); pending OT ignored; net = gross + adjustments − deductions

### TC-08b: Payslip grid shows employee name + code

- **Priority:** High
- **Preconditions:** Computed pay run with at least one payslip for a known employee201 row.
- **Steps:**
  1. Open `/dashboard/pay-runs/$id`.
- **Expected result:** Employee column shows display name (not only UUID). Secondary line shows `#employeeCode` when present, otherwise the employee id. API `GET .../payslips` includes `employeeName` and `employeeCode`.

### TC-08c: Payslip grid pagination

- **Priority:** Medium
- **Preconditions:** Computed pay run with more than 10 payslips (or change rows per page to a size smaller than the list).
- **Steps:**
  1. Open `/dashboard/pay-runs/$id`.
  2. Confirm footer shows `1–N of T payslips`, rows-per-page selector, Previous/Next.
  3. Change rows per page; go to next page.
- **Expected result:** Table shows only the current page of rows; page resets to 1 when page size changes; Previous disabled on page 1; Next disabled on last page.

### TC-09: Compute notifies payroll ops

- **Priority:** High
- **Steps:** Compute as finance
- **Expected result:** Users with `payroll.pay_runs.view` get `pay-run-computed` notification; payroll bell links to pay-run detail; regular employees do not see this type

### TC-09b: View payslip details page

- **Priority:** High
- **Preconditions:** At least one released payslip for the signed-in employee
- **Steps:**
  1. Open `/dashboard/my-payslips`
  2. Click a period link or **View**
- **Expected result:** Dedicated payslip details page matching the document layout: period/payment date, company block, employee info (name, ID, department, job title, status, TIN), statutory IDs, rate details, earnings/deductions tables, and net pay summary. Back returns to the list. Print / Download PDF open the browser print dialog.
- **Auth:** Opening another employee’s payslip id → 403/Forbidden message

### TC-09c: Contribution tables show seeded brackets

- **Priority:** High
- **Preconditions:** `npm run seed:contribution-schedules` run in `tito-hris-api`; ops user
- **Steps:**
  1. Open `/dashboard/contribution-tables`
  2. Open the Schedule select
- **Expected result:** SSS, HDMF, and PhilHealth schedules listed with bracket counts; selecting one shows Min / Max / Employee share / Employer share rows with money values (not blank page).

### TC-10: Edit adjustment then approve & release

- **Priority:** High
- **Steps:**
  1. Compute → select non-consultant payslip
  2. Change other adjustment without a reason → Save
  3. Enter a reason → Save
  4. Approve & release
- **Expected result:** Step 2 → 400 (reason required). Step 3 → totals recalculate; `other` adjustment note stores the reason; T201 Audit Trail module **Payroll** shows `otherAdjustment` update with `{amount} | {reason}` (action + audit in one DB commit). After release, slips appear under each employee login; each linked employee gets `payslip-released`. Direct SQL `UPDATE`/`DELETE` on `employee201.audit_log` fails (`immutable`).

### TC-10d: Payslip view is access-logged; gov IDs and money round-trip

- **Priority:** High
- **Preconditions:** Computed or released payslip with SSS/TIN on the employee
- **Steps:**
  1. `GET /api/payroll/payslips/:id` as ops (and as the employee for a released slip)
  2. `GET /api/payroll/payslips/me` and `GET /api/payroll/payslips` (ops)
  3. Open T201 Audit Trail filtered to module Payroll / action view
  4. Inspect DB `payroll.payslip.sss_number`, `basic_pay`, `net_pay` / `employee201.employee.sss_number`
- **Expected result:** API JSON shows plaintext statutory numbers and money for authorized callers. Each read writes a `view` row with **null** old/new values (no numbers or amounts logged) and populated `ip_address` / `user_agent` when present. DB columns store AES-GCM ciphertext (`iv:authTag:payload` hex) after write/encrypt-on-next-update; legacy plaintext still decrypts as plaintext until rewritten.

### TC-10f: Compute resume skips written lines and keeps other adjustments

- **Priority:** High
- **Preconditions:** Draft regular pay run ready to compute; at least two active employees
- **Steps:**
  1. Start Compute; interrupt the API process mid-batch (or stop after status is `computing` with some slips present)
  2. Confirm status is `computing` and some payslips exist
  3. Click **Resume** (same Compute endpoint)
  4. On a fully `computed` run, PATCH other adjustment with a reason on one slip → Compute again → confirm that slip keeps the other adjustment amount/reason after recompute
- **Expected result:** Resume does not duplicate `(pay_run_id, employee_id)` lines. Employees already written are skipped. When complete, status is `computed` and ops get `pay-run-computed` once. Full recompute from `computed` restores saved other-adjustments via `pay_run_adjustment_hold`.

### TC-10e: Compute pins table versions; bracket save forks

- **Priority:** High
- **Preconditions:** Active SSS (and optionally tax) schedule; draft pay run ready to compute
- **Steps:**
  1. Compute the pay run → note `sssScheduleId` / `taxScheduleId` on `GET /api/payroll/pay-runs/:id` (and truncated ids on pay-run detail)
  2. Edit brackets on that SSS schedule → Save
  3. Re-open the released/computed payslip amounts; list contribution schedules
- **Expected result:** Step 2 creates a **new** schedule id (`forkedFromId` set); old schedule is inactive / closed. Payslip money fields unchanged. New computes use the forked active schedule.

### TC-10c: 13th month when batch is flagged

- **Priority:** High
- **Preconditions:** At least one released payslip earlier in the same calendar year with known Basic; create a new draft with **Include 13th month pay** checked
- **Steps:** Compute
- **Expected result:** Each non-consultant slip has `thirteenthMonthPay` = 1/12 of (prior released Basic YTD + this cutoff Basic). Unflagged batch → all `0.00`. Consultant on a flagged batch → `0.00`.

### TC-10b: Remove contribution bracket

- **Priority:** Medium
- **Preconditions:** Schedule with 2+ brackets
- **Steps:**
  1. Open Contribution tables; select a fund
  2. Click **Remove** on one bracket row
  3. Click **Save brackets**
- **Expected result:** Row disappears from the draft immediately; after save and refresh, that bracket is gone from the schedule.

### TC-11: Release freezes recompute and edits

- **Priority:** High
- **Steps:** After release, Compute again and PATCH payslip
- **Expected result:** Conflict/forbidden errors

### TC-11b: Correction batch from released regular run

- **Priority:** High
- **Preconditions:** Released regular pay run with at least one non-consultant payslip; HR or finance JWT
- **Steps:**
  1. Open the released source → **Create correction** → select one or more non-consultant employees → Create
  2. Note source `releasedBy` / `releasedAt`
  3. On the new draft: Compute → set other adjustment + reason → Save → Approve & release
  4. Re-open the source run and PATCH a source payslip
- **Expected result:**
  - New run has `kind=correction`, same period/cutoff, `correctsPayRunId` = source
  - Compute yields net `0.00` until other adjustment; list shows **Correction** badge; detail links to source
  - After release, employee sees an extra slip under My payslips
  - Source `releasedBy` / `releasedAt` / amounts unchanged; PATCH on source still 409

### TC-11c: Correction rejects consultants and Super Admin create

- **Priority:** High
- **Steps:**
  1. As HR, try creating a correction that includes a consultant (or an employee not on the source)
  2. As `super_admin`, `POST /api/payroll/pay-runs/:id/corrections`
- **Expected result:** Step 1 → 400. Step 2 → 403; Create correction control hidden for Super Admin

### TC-12: My payslips — paper layout + print

- **Priority:** High
- **Steps:** As employee open list → open slip → Print / Save as PDF
- **Expected result:** Only released own slips listed; paper layout (letterhead, rates, gross, deductions, adjustments, red net, prepared by); print stylesheet hides chrome

### TC-12b: Create pay run with period date range

- **Priority:** High
- **Steps:**
  1. Open `/dashboard/pay-runs`.
  2. Click Period to open the dual-month calendar. Pick a start day, then an end day.
  3. Confirm cutoff half, click Create.
- **Expected result:** Draft pay run appears with the selected period. Completing the range commits and closes the picker.

### TC-13: IDOR — another employee's payslip id

- **Priority:** High
- **Steps:** As employee A, `GET /api/payroll/payslips/{B's id}` (released)
- **Expected result:** 403; UI shows generic forbidden/empty state

### TC-14: Contribution bracket edit affects next compute

- **Priority:** Medium
- **Preconditions:** Seeded contribution schedules
- **Steps:** Change employee share on HDMF → recompute draft/computed 1st cutoff
- **Expected result:** New `hdmf` amount on payslips

### TC-17: Paid leave restores Basic (no additive leave pay)

- **Priority:** High
- **Preconditions:** Approved paid leave overlapping period with little/no Clock that day; separate case with `UNPAID` / LWOP; consultant with paid leave type
- **Steps:** Compute pay run
- **Expected result:** Paid leave → `hoursWorked` includes restored gap (`max(0, expected − clocked)`); `basicPay` / `grossPay` include those hours at hourly; `leavePay` = `0.00` (no additive adjustment); unpaid days → `unpaidLeaveDays` set, restore `0`, Clock hours unchanged; consultant → no restore, `leavePay` `0.00`

### TC-18: Withholding tax from Gross − contributions

- **Priority:** High
- **Preconditions:** Seeded monthly tax schedule; employee covered, not consultant; Gross large enough that `(gross − contributions) × 2` hits a taxable TRAIN bracket; `splitWithholding` off (default)
- **Steps:** Compute
- **Expected result:** `withholdingTax` = **full** monthly TRAIN on `(gross − SSS − HDMF − PhilHealth) × 2`; appears on paper slip; consultants / uncovered → `0.00`

### TC-18b: Split withholding on — remainder on 2nd cutoff

- **Priority:** High
- **Preconditions:** Migration `0043_payroll_withholding_split.sql`; monthly tax table; 1st and 2nd cutoff pay runs in the same month
- **Steps:**
  1. Create / open 1st cutoff with **Split monthly withholding** on → Compute
  2. Note each slip’s `withholdingTax` (floor half of monthly)
  3. Create / open 2nd cutoff with split on → Compute
  4. On a computed slip, edit withholding tax → Save; confirm net updates on screen immediately
- **Expected result:** 1st = `floor(monthly/2)`; 2nd = monthly on `(1st taxable + 2nd taxable)` − stored 1st withholding. Toggle on detail updates WHT/Net immediately then PATCH reconciles. Tax field remains editable when split is on.

### TC-19: Tax tables RBAC

- **Priority:** High
- **Steps:** User without `payroll.tax_tables.view` / `manage` hits tax-schedules endpoints; ops open `/dashboard/tax-tables`
- **Expected result:** 403 without permission; **finance** and **admin** can draft / import / edit draft brackets; **Publish draft** only for **super_admin** (`payroll.tax_tables.publish`); finance/admin `POST .../draft/publish` → 403; published schedule edit → 400

### TC-19d: Add bracket to draft by frequency

- **Priority:** High
- **Preconditions:** Migration `0042_payroll_tax_draft_brackets.sql` applied; finance or super_admin JWT
- **Steps:**
  1. Open `/dashboard/tax-tables`
  2. Add bracket: frequency `semi-monthly`, sequence `1`, min / max / base / rate / excess-over
  3. Confirm list filters to semi-monthly on the draft schedule
  4. Confirm the prior active monthly schedule is unchanged
  5. Duplicate the same sequence on semi-monthly
- **Expected result:** Bracket saved via `POST /api/payroll/tax-schedules/draft/brackets`; draft created if missing; active schedule untouched; duplicate sequence → 409

### TC-19d2: Edit or delete draft bracket only

- **Priority:** High
- **Preconditions:** Draft with at least one bracket; active published schedule also present
- **Steps:**
  1. Select the draft schedule
  2. Edit one bracket (change rate / max)
  3. Confirm the active schedule’s brackets are unchanged
  4. Delete another draft bracket
  5. Attempt `PATCH` / `DELETE` on a bracket id that belongs to the active schedule
- **Expected result:** Draft updates via `PATCH` / `DELETE .../draft/brackets/:id`; active schedule unchanged; mutate on published bracket → 400

### TC-19d3: Import CSV into draft

- **Priority:** High
- **Preconditions:** finance or super_admin JWT; sample CSV with header `frequency,sequence,minCompensation,maxCompensation,baseTax,rateOnExcess,excessOver`
- **Steps:**
  1. Open `/dashboard/tax-tables` → Import CSV with a valid file (blank max = open)
  2. Confirm the UI selects the draft and lists imported rows
  3. Confirm the active schedule is unchanged and status is still draft (not published)
  4. Import a bad CSV (wrong header or invalid frequency)
- **Expected result:** Valid import → `POST /api/payroll/tax-schedules/draft/import` replaces draft brackets only; bad CSV → 400 and no bracket writes on draft or active

### TC-19e: Publish draft tax schedule

- **Priority:** High
- **Preconditions:** Draft with at least one bracket; **super_admin** JWT
- **Steps:** Click Publish draft
- **Expected result:** Draft becomes active; previous active is deactivated; pay runs that pinned the old schedule id keep that pin; next compute uses the published brackets; finance/admin cannot see Publish or get 403 on publish endpoint

### TC-19e2: Published schedule immutable

- **Priority:** High
- **Steps:** As finance, `PUT /api/payroll/tax-schedules/{activeId}/brackets` or edit actions on the active schedule in UI
- **Expected result:** 400; UI shows no edit/delete on published schedules; only draft is editable

### TC-19f: T201 profile Payslips tab (ops)

- **Priority:** High
- **Preconditions:** Released payslips for employee E; Nest `admin` or `super_admin` JWT in T201
- **Steps:** Open T201 `/dashboard/employees/{E}` → Payslips tab
- **Expected result:** Lists E’s released slips (period, cutoff, gross, deductions, net) via `GET /api/payroll/employees/{E}/payslips`. Employee JWT: tab absent; same GET → 403. Unreleased slips do not appear.

### TC-19b: Super Admin cannot process pay runs

- **Priority:** High
- **Preconditions:** `super_admin` JWT
- **Steps:**
  1. Open `/dashboard/pay-runs` and a draft/computed `$id`
  2. Attempt `POST .../compute`, `POST .../release`, `PATCH .../payslips/:id`
- **Expected result:** Create / Compute / Approve & release / Save adjustment controls hidden; API returns 403

### TC-19c: HR cannot edit contribution tables

- **Priority:** High
- **Preconditions:** `admin` JWT
- **Steps:** Open `/dashboard/contribution-tables` → Brackets → attempt Save / PUT brackets
- **Expected result:** Inputs read-only; Add/Save/Remove hidden; API 403 on manage endpoints; compute/release still available on pay runs

### TC-20: Other adjustment and tax PATCH still work

- **Priority:** High
- **Steps:** Computed run → edit Other adjustment (with reason) and/or Withholding tax → Save
- **Expected result:** Net recalculates on screen and on server; `other` adjustment line upserted when adjustment changes; tax amount persists until next Compute or split toggle

### TC-15: Auth — employee cannot create pay run

- **Priority:** High
- **Steps:** Employee JWT `POST /api/payroll/pay-runs`
- **Expected result:** 403

### TC-16: T201 bell does not 404 on payroll types

- **Priority:** Medium
- **Steps:** With `pay-run-computed` / `payslip-released` / `pay-run-missing-data` / `pay-run-approval-reminder-7` / `-2` / `pay-run-approval-overdue` / `holiday-work-unfiled-reminder` in T201 notifications list (and optional `VITE_PAYROLL_APP_URL`)
- **Expected result:** Message shows; with base URL, opens payroll; without base URL, no in-app T201 route (no 404)

## Edge Cases & Error States

- periodStart after periodEnd → 400
- Money fields remain strings
- Open Clock timers excluded from hours
- Missing hourly rate or unlinked Clock `userId` → readiness issue; regular Compute → 409 (not silent zero payslips)
- Correction readiness always empty; correction compute not blocked by missing rates/links
- Identity snapshot on payslip does not change when 201 profile is edited after compute
- Approval reminder stages dedupe per type + pay run; draft/released skipped
- Unfiled holiday reminders dedupe per user + cutoff start + holiday date; skip after periodEnd / released regular run / consultants
- `audit_log` is append-only (trigger blocks UPDATE/DELETE)
- Published tax schedules are immutable (draft endpoints only); Super Admin publishes
- Payslip / salary-rates / unmasked employee detail GETs write `view` audits without storing statutory numbers

## Out of Scope

- Identity contract / BUG-TC-01
- Encrypting salary / pay money amounts at rest
- Renaming `pay_run` HTTP path to Batch
- ND-PR-13 (subtract Clock hours for LWOP)
- Automatic December 13th-month payout (HR flags the batch)
- Subtracting 13th month already paid earlier in the same year
- Email / SMTP delivery of payroll alerts
- Clock WebSocket sync
- Granting people_culture payroll ops
- Stored PDF blobs / R2
- Expected-release-date column (due date = cutoff periodEnd)
- Changing Clock auto-approve holiday hours / building a Clock holiday-claim submit UI
- Dedicated payroll “access log” UI page (use T201 Audit Trail)
