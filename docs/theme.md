# Theme (light / dark / system)

Client-only appearance preference for Tito Payroll, matching T201’s Light / Dark / System UX.

## Behavior

- Options: **Light**, **Dark**, **System**.
- **Default is light.** First visit (no saved preference) always applies light and writes `ui-theme=light`. OS preference is ignored until the user picks **System**.
- Preference is stored in `localStorage` under `ui-theme` (not a cookie / not the HRIS API).
- An inline FOUC script in the root layout applies the class on `<html>` before paint to avoid a flash.
- `ThemeProvider` keeps `document.documentElement` in sync and listens to `prefers-color-scheme` only when theme is `system`.

## UI

| Location | Component |
| --- | --- |
| Dashboard topnav (left of notifications) | `ModeToggle` in `app-shell.tsx` |
| Sign-in, MFA, auth success (top-right) | `ModeToggle` |

## Files

- `src/components/theme-provider.tsx` — context + `localStorage`
- `src/components/mode-toggle.tsx` — sun/moon button + menu
- `src/routes/__root.tsx` — FOUC script + provider wrap
- `src/styles/app.css` — `@custom-variant dark`, `:root` / `.dark` tokens (teal accent `#00c2a8`)

## Auth / API

None. Theme is UI-only; no HRIS endpoint.
