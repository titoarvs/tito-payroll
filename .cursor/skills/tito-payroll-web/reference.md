# Tito Payroll web — file map

## Target layout

```
src/
  routes/                 # TanStack file routes
  components/
    ui/                   # shared primitives
    <feature>/            # feature UI
  hooks/                  # use-<feature>.ts
  queries/                # <feature>.ts queryOptions
  api-services/
    hris-api-client.ts    # or src/lib/hris-api-client.ts — one shared client
    <feature>.types.ts
    <feature>.service.ts
    <feature>.mappers.ts  # only if API shape ≠ UI shape
  lib/
    hris-api-client.ts
    hris-auth.ts
  config/env.ts           # Zod env; VITE_HRIS_API_BASE_URL
```

If `src/app/` exists, delete it — routes live in `src/routes/`.

## Route file naming (TanStack Start)

```
__root.tsx          → root layout
index.tsx           → index route
$param.tsx          → dynamic segment
dashboard.tsx       → layout route with <Outlet />
```

## Query keys

```ts
export const payslipsKeys = {
  all: ["payslips"] as const,
  list: (filters: PayslipListParams) => [...payslipsKeys.all, "list", filters] as const,
  detail: (id: string) => [...payslipsKeys.all, "detail", id] as const,
};
```

- List: `["resource-plural", "list", filters]`
- Detail: `["resource-plural", "detail", id]`

## Copy-from

| Need | Source |
|------|--------|
| `hrisApi` + token refresh | `T201/src/lib/hris-api-client.ts` |
| HRIS login/session | `T201/src/lib/hris-auth.ts` |
| File routes + Query | `T201/src/routes/`, `T201/src/queries/` |
| `*.service.ts` + types | `time-tracker-web/src/api-services/` (functions, not new Axios classes) |
| Nest payroll module | `tito-hris-api/src/payroll/`, `add-nest-feature` skill |

## Commands

Use scripts in `tito-payroll/package.json` (`pnpm dev`, `pnpm build`, `pnpm typecheck`).
