# Architecture

## Purpose

Tito Payroll is a **web-only** TanStack Start client. Auth and payroll data
live in `tito-hris-api`. This package has no Postgres, Drizzle, or local schema.

## Data flow

```
Routes → components → hooks → queries → api-services → tito-hris-api
```

## Layout

```
src/routes/           TanStack file routes
src/router.tsx        QueryClient + router
src/components/ui/    primitives
src/lib/utils.ts      cn()
src/styles/app.css    Tailwind
```

See `.cursor/skills/tito-payroll-web/SKILL.md`.
