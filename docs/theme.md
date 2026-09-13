# Theme (light / dark / system)

Client-only appearance preference for Tito Payroll, matching T201’s Light / Dark / System UX.

## Visual system

- **Colors:** Tito green / navy tokens (`--tito-green`, `--tito-blue`, light canvas `#f5fbfb`). Primary CTA uses Tito green.
- **Type:** **Poppins** (400 / 500 / 700) for UI; **Mont** for the Tito wordmark logo only (`font-mont`). Self-hosted under `public/fonts/`.
- **Radius:** Soft corners (`--radius` 0.5rem; cards/tables use `rounded-xl`).
- **Tables:** Soft muted header band, hairline horizontal row dividers only, roomier cell padding (`first`/`last` inset). No vertical column rules. Sticky roster headers use muted + light blur.
- **Materials:** Sticky header uses `.glass-nav` (`backdrop-filter` blur + saturate). Auth surfaces keep frosted glass. Respect `prefers-reduced-transparency` (solid backgrounds) and `prefers-reduced-motion` (no lift / springy enter).
- **KPI tints:** Uniform white (`bg-card`) metric tiles — no pastel washes.

## Behavior

- Options: **Light**, **Dark**, **System**.
- **Default is light.** First visit (no saved preference) always applies light and writes `ui-theme=light`. OS preference is ignored until the user picks **System**.
- Preference is stored in `localStorage` under `ui-theme` (not a cookie / not the HRIS API).
- An inline FOUC script in the root layout applies the class on `<html>` before paint to avoid a flash.
- `ThemeProvider` keeps `document.documentElement` in sync and listens to `prefers-color-scheme` only when theme is `system`.

## UI

| Location                                 | Component                            |
| ---------------------------------------- | ------------------------------------ |
| Dashboard topnav (left of notifications) | `ModeToggle` in `payroll-header.tsx` |
| Sign-in, MFA, auth success (top-right)   | `ModeToggle`                         |

## Files

- `src/styles/app.css` — Poppins `@font-face`, tokens, glass / KPI utilities
- `src/components/theme-provider.tsx` — context + `localStorage`
- `src/components/mode-toggle.tsx` — sun/moon button + menu
- `src/routes/__root.tsx` — FOUC script + provider wrap
- `src/components/layout/page-header.tsx` — shared title + actions row

## Auth / API

None. Theme is UI-only; no HRIS endpoint.
