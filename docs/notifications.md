# Notifications and email

## Purpose

In-app notification inbox plus Resend-backed email templates (console fallback
when `RESEND_API_KEY` is unset).

## Schema

`src/db/schema/notification.ts` — `notification` rows keyed by `userId`.

## Helpers

- `src/lib/notify.ts` — `notify({ userId, type, title, body, href, email? })`
- `src/lib/emails/templates.ts` — welcome, order receipt, reset password
- `src/lib/emails/send-reset-password.ts` — used by Better Auth

## Routes / actions

- `/notifications` — `requireSession`
- `markRead`, `markAllRead` in `src/features/notifications/actions.ts`
- Bell unread count in `(app)` and `(admin)` layouts

## Emitters

- Signup — Better Auth `databaseHooks.user.create.after` → welcome
- Role change — `setUserRole` in `src/app/(admin)/users/actions.ts`
- Order paid — Stripe webhook after marking order paid

## Removing this module

1. Delete schema, `src/lib/notify.ts`, `src/features/notifications/`, emails
   folder (keep a minimal reset-password helper in `mail.ts` if auth still needs it)
2. Remove notify calls from auth, users actions, stripe webhook
3. Drop bell / notifications nav + proxy prefixes
4. Delete this doc and QA file
