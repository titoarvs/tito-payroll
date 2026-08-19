---
name: payroll-api-hooks
description: >-
  Generates tito-payroll api-services, queryOptions, and TanStack Query hooks
  that call tito-hris-api. Use when adding or changing a payroll HTTP resource,
  Nest controller, DTO, or when the user asks for API hooks, services, or to
  connect payroll web to the HRIS API.
---

# Payroll API hooks + services

Standard codegen for connecting `tito-payroll` to `tito-hris-api`. One HTTP resource ⇒ four web files (plus UI). API remains source of truth.

Read the Nest controller + DTOs first. Do not invent paths or field names.

## Generate this set

For resource `pay-runs` (kebab plural matching `@Controller`):

| File | Responsibility |
|------|----------------|
| `src/api-services/pay-runs.types.ts` | Request/response types matching DTOs |
| `src/api-services/pay-runs.service.ts` | `hrisApi` calls only |
| `src/queries/pay-runs.ts` | Query keys + `queryOptions` |
| `src/hooks/use-pay-runs.ts` | `useQuery` / `useMutation`, toast, invalidation |

Optional: `src/api-services/pay-runs.mappers.ts` only when the UI must reshape the payload.

Do not add a fifth abstraction (repository, SDK class, OpenAPI runtime).

## Shared client

Use one client: `hrisApi` from `src/lib/hris-api-client.ts` (T201 pattern).

```ts
import { hrisApi } from "~/lib/hris-api-client";
```

If the file is missing, copy `T201/src/lib/hris-api-client.ts` and rename storage keys to `payroll.hris.*`.

Once: `src/api-services/query-string.ts`

```ts
export const toQueryString = (params: Record<string, unknown> = {}): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};
```

## Service template

Named object, not a class. Append list filters with a query string (copy `toQueryString` from `T201/src/lib/employee201-api.ts` into `src/api-services/query-string.ts` once, then reuse).

```ts
import { hrisApi } from "~/lib/hris-api-client";
import { toQueryString } from "./query-string";
import type {
  PayRun,
  PayRunListParams,
  CreatePayRunInput,
  UpdatePayRunInput,
} from "./pay-runs.types";

const PATH = "/pay-runs";

export const payRunsService = {
  list: (params: PayRunListParams = {}) =>
    hrisApi.get<PayRun[]>(`${PATH}${toQueryString(params)}`),
  getById: (id: string) => hrisApi.get<PayRun>(`${PATH}/${id}`),
  create: (input: CreatePayRunInput) => hrisApi.post<PayRun>(PATH, input),
  update: (id: string, input: UpdatePayRunInput) =>
    hrisApi.patch<PayRun>(`${PATH}/${id}`, input),
  remove: (id: string) => hrisApi.delete<void>(`${PATH}/${id}`),
};
```

- Path = controller path without the `/api` prefix (`hrisApi` base URL already includes `/api`).
- Method names: `list`, `getById`, `create`, `update`, `remove` (add domain verbs only when the API has them: `approve`, `post`, `void`).
- Types: `interface` for objects. Field names match the API JSON.

## Query template

```ts
import { queryOptions } from "@tanstack/react-query";
import { payRunsService } from "~/api-services/pay-runs.service";
import type { PayRunListParams } from "~/api-services/pay-runs.types";

export const payRunsKeys = {
  all: ["pay-runs"] as const,
  list: (params: PayRunListParams = {}) =>
    [...payRunsKeys.all, "list", params] as const,
  detail: (id: string) => [...payRunsKeys.all, "detail", id] as const,
};

export const getPayRunsQuery = (params: PayRunListParams = {}) =>
  queryOptions({
    queryKey: payRunsKeys.list(params),
    queryFn: () => payRunsService.list(params),
  });

export const getPayRunQuery = (id: string) =>
  queryOptions({
    queryKey: payRunsKeys.detail(id),
    queryFn: () => payRunsService.getById(id),
    enabled: Boolean(id),
  });
```

## Hook template

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payRunsService } from "~/api-services/pay-runs.service";
import type { CreatePayRunInput, UpdatePayRunInput } from "~/api-services/pay-runs.types";
import { getPayRunQuery, getPayRunsQuery, payRunsKeys } from "~/queries/pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

const messageFromError = (error: unknown, fallback: string) =>
  error instanceof HrisApiError ? error.message : fallback;

export const usePayRuns = (params = {}) => useQuery(getPayRunsQuery(params));

export const usePayRun = (id: string) => useQuery(getPayRunQuery(id));

export const useCreatePayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePayRunInput) => payRunsService.create(input),
    onSuccess: () => {
      toast.success("Pay run created");
      void queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
    },
    onError: (error: unknown) => {
      toast.error(messageFromError(error, "Failed to create pay run"));
    },
  });
};

export const useUpdatePayRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayRunInput }) =>
      payRunsService.update(id, input),
    onSuccess: (_data, { id }) => {
      toast.success("Pay run updated");
      void queryClient.invalidateQueries({ queryKey: payRunsKeys.all });
      void queryClient.invalidateQueries({ queryKey: payRunsKeys.detail(id) });
    },
    onError: (error: unknown) => {
      toast.error(messageFromError(error, "Failed to update pay run"));
    },
  });
};
```

Hook files export named `const` functions with a `use` prefix. Mutations that need user input keep it in the mutation variables — no parallel `useState` form store unless the screen already does that.

## UI wiring

- Components call hooks only — never import `hrisApi` or `*Service`.
- Routes: `beforeLoad` for session; `loader` may `ensureQueryData(getPayRunsQuery())`.
- Forms: Zod schema mirroring create/update DTO fields the user can edit.

## Types

- Copy API fields 1:1. Dates stay `string` (ISO). Money stays `string`.
- `CreateXInput` / `UpdateXInput` match create/update DTOs.
- Do not re-export Nest DTO classes into the web app.

## When the API does not exist yet

1. Add Nest feature under `tito-hris-api/src/payroll/<feature>/` (`add-nest-feature`).
2. Then generate the four web files from the controller.
3. Same task — **payroll-hris-sync**.

## Do not

- Call `hrisApi` from components or routes
- Put toasts in `queries/` or `*.service.ts`
- Generate OpenAPI clients or extra SDK packages
- Add React Query in a Next.js server component — this app is Start + client hooks
- Duplicate T201 `src/fn` / `src/data-access` / `src/use-cases` layers (no local backend)

Full copy-paste example: [examples.md](examples.md).
