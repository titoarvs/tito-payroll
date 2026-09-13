# Tito Payroll 

Web client for payroll. **No local database.** Auth and data live in
[`tito-hris-api`](../tito-hris-api).

## Stack

TanStack Start + Vite. Run the HRIS API separately.

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

App: [http://localhost:3002](http://localhost:3002)

Point `VITE_HRIS_API_BASE_URL` at the running HRIS API (`http://localhost:8000/api`).

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Vite / TanStack Start |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm verify` | typecheck + lint + build |
