# Example: payslips resource

Assume API:

- `@Controller('payslips')`
- `GET /api/payslips`, `GET /api/payslips/:id`
- `POST /api/payslips/:id/release`
- DTO fields: `id`, `employeeId`, `payRunId`, `netPay`, `status`, `periodStart`, `periodEnd`

## `payslips.types.ts`

```ts
export interface Payslip {
  id: string;
  employeeId: string;
  payRunId: string;
  netPay: string;
  status: "draft" | "released" | "void";
  periodStart: string;
  periodEnd: string;
}

export interface PayslipListParams {
  payRunId?: string;
  employeeId?: string;
}
```

## `payslips.service.ts`

```ts
import { hrisApi } from "~/lib/hris-api-client";
import { toQueryString } from "./query-string";
import type { Payslip, PayslipListParams } from "./payslips.types";

const PATH = "/payslips";

export const payslipsService = {
  list: (params: PayslipListParams = {}) =>
    hrisApi.get<Payslip[]>(`${PATH}${toQueryString(params)}`),
  getById: (id: string) => hrisApi.get<Payslip>(`${PATH}/${id}`),
  release: (id: string) => hrisApi.post<Payslip>(`${PATH}/${id}/release`),
};
```

Import `toQueryString` from `src/api-services/query-string.ts`. Do not invent a second request helper.

## Queries + hooks

`src/queries/payslips.ts` — `payslipsKeys`, `getPayslipsQuery`, `getPayslipQuery`.

`src/hooks/use-payslips.ts` — `usePayslips`, `usePayslip`, `useReleasePayslip` (invalidate `payslipsKeys.all` on success).

## Component

```tsx
const { data, isPending } = usePayslips({ payRunId });
const release = useReleasePayslip();
// presentational table; release.mutate(id) from a dialog
```
