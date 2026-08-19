# Commerce — Stripe shop

## Purpose

Products, cart, Stripe Checkout, orders, and Customer Portal. Prices always
come from the server — never trust client amounts.

## Schema

`src/db/schema/commerce.ts`:

- `product`, `cart`, `cart_item`, `customer`, `order`, `order_item`, `stripe_event`

## Routes

| Route | Guard |
| --- | --- |
| `/shop`, `/shop/[slug]` | `requireSession` |
| `/cart` | `requireSession` |
| `/orders`, `/orders/[id]` | `requireSession` + ownership on detail |
| `/admin/products`, `/admin/products/new`, `/admin/products/[id]` | `requireAdmin` |
| `/admin/orders`, `/admin/orders/[id]` | `requireAdmin` |
| `POST /api/stripe/webhook` | Stripe signature |

## Actions

`src/features/commerce/actions.ts`:

- `addToCart`, `updateCartItem`
- `createCheckoutSession` — builds order from DB prices, redirects to Stripe
- `createBillingPortalSession`
- `createProduct`, `updateProduct` — write audit `product_created` / `product_updated`

## Webhook

`src/app/api/stripe/webhook/route.ts`:

1. `constructEvent` with raw body
2. Insert `stripe_event.id` (skip duplicates)
3. On `checkout.session.completed`, mark order `paid` + audit `order_paid`

Local forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Env

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DEFAULT_CURRENCY` (default `usd`).

## Removing this module

1. Delete `src/db/schema/commerce.ts`, `src/features/commerce/`, shop/cart/orders
   routes, admin products/orders routes, webhook route, `src/lib/stripe.ts`
2. Remove schema export and nav links
3. Drop Stripe env keys
4. Delete this doc and `docs/qa/commerce.test-cases.md`
