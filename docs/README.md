# Docs index

Project documentation for the Next.js modular template.

## Architecture

- [architecture.md](./architecture.md) — layers, auth model, module map

## Features

- [authentication.md](./authentication.md) — login, signup, Google SSO, password reset
- [app-shell.md](./app-shell.md) — `/dashboard`, settings, shared sidebar
- [user-management.md](./user-management.md) — admin `/users`
- [audit-trail.md](./audit-trail.md) — audit log + `/audit`
- [files.md](./files.md) — S3 uploads
- [commerce.md](./commerce.md) — shop, cart, Stripe
- [notifications.md](./notifications.md) — inbox + email templates
- [analytics.md](./analytics.md) — events + `/admin/analytics` + GA4
- [landing-and-authorization.md](./landing-and-authorization.md) — role-gated landing UX

## QA

- [qa/authentication.test-cases.md](./qa/authentication.test-cases.md)
- [qa/app-shell.test-cases.md](./qa/app-shell.test-cases.md)
- [qa/user-management.test-cases.md](./qa/user-management.test-cases.md)
- [qa/audit-trail.test-cases.md](./qa/audit-trail.test-cases.md)
- [qa/files.test-cases.md](./qa/files.test-cases.md)
- [qa/commerce.test-cases.md](./qa/commerce.test-cases.md)
- [qa/notifications.test-cases.md](./qa/notifications.test-cases.md)
- [qa/analytics.test-cases.md](./qa/analytics.test-cases.md)

## Agent workflow

When changing features, follow `.cursor/skills/feature-workflow/SKILL.md`:

1. Implement with server-side auth
2. Update feature docs + QA cases
3. Run `pnpm verify` (typecheck, lint, test, build) and fix failures
