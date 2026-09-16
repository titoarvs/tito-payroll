# Payroll source data (T201 / employee201)

Read-only clients for Basic Pay inputs, deductions eligibility, leave treatment, and holiday premiums. **Cutoff compute** (Basic / Gross / statutory / leave / tax) lives in `docs/pay-runs.md`.

## Source of truth

All data comes from **tito-hris-api-v2** `employee201` (not the T201 app DB directly).

| Need | Endpoint / API usage | Notes |
| --- | --- | --- |
| Monthly salary + hourly rate + allowance | Payroll salary-rates / employee201 salary | Audited; amounts as strings. |
| Employment / benefits flags | `GET` employee201 employee | `employmentStatus`, coverage booleans. |
| Leave in cutoff | Approved leave via `LeaveRequestRepository.findApprovedInDateRange` | Keyed by **`employee.id`**. Prorate overlap with weekdays; paid leave restores Basic hours (`max(0, expected − Clock)`); `UNPAID` → unpaid days only (no restore). |
| Holidays + premium % | employee201 holidays | Confirmed instances with premium. |
| Withholding | `payroll.tax_schedule` / `tax_bracket` | Monthly TRAIN-style; applied to `(Gross − contributions) × 2`, half withheld per cutoff. |

## Consultant routing

When `employmentStatus === "consultant"`:

- Computation path: Hours × Rate only (Gross = Basic; allowance forced to `0.00`)
- No statutory deductions, leave restore, withholding, OT/ND/holiday premiums, other adjustment, or 13th month
- Adjustment PATCH on consultant slips is rejected

## HMO

HMO fields are **record-keeping only**. The deductions engine must never subtract HMO.

## Related

Cutoff compute + contribution / tax tables: [pay-runs.md](./pay-runs.md).

## Out of scope (this pass)

- ND-PR-13 balance-exceed / Clock hour reduction for LWOP
- Identity contract across T201 / Clock / Payroll
