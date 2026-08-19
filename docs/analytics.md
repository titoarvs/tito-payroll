# Analytics

## Purpose

First-party event table plus an admin dashboard. Optional GA4 via
`NEXT_PUBLIC_GA_MEASUREMENT_ID`.

## Schema

`src/db/schema/analytics.ts` — `analytics_event`

## Ingest

- `POST /api/events` — Zod-validated; per-IP in-memory throttle
  (`ponytail:` single-instance; Redis later)
- `AnalyticsTracker` in root layout — `page_view` beacons
- `track()` in `src/lib/analytics.ts` — server events: `signup`, `login`,
  `purchase`

## Dashboard

`/admin/analytics?range=7d|30d|90d` — KPI cards, SVG spark bars, top paths.
Guarded by `requireAdmin`.

## GA4

`src/components/analytics/google-analytics.tsx` — `next/script` +
`useReportWebVitals` → `gtag` when measurement id is set.

## Removing this module

1. Delete schema, `src/lib/analytics*.ts`, `/api/events`, tracker/GA components,
   `/admin/analytics`, spark-bars
2. Remove track calls from auth + stripe webhook
3. Drop GA env var
4. Delete this doc and QA file
