# Commerce — QA Test Cases

## Overview

Shop, cart, Stripe Checkout, orders, and admin catalog.

## Prerequisites

- Signed-in user; admin for catalog
- Optional: Stripe keys + `stripe listen` for full checkout

## Test Cases

### TC-01: Guest redirected from shop

- **Priority:** High
- **Preconditions:** Signed out
- **Steps:** Visit `/shop`
- **Expected result:** Redirect to login

### TC-02: Admin creates product

- **Priority:** High
- **Preconditions:** Admin session
- **Steps:**
  1. Open `/admin/products/new`
  2. Submit name + price
- **Expected result:** Product appears in list and on `/shop`

### TC-03: Add to cart and update qty

- **Priority:** High
- **Preconditions:** Active product exists
- **Steps:**
  1. Add product from `/shop`
  2. Change quantity on `/cart`
- **Expected result:** Line total and cart total update

### TC-04: Checkout without Stripe configured

- **Priority:** Medium
- **Preconditions:** Cart has items; `STRIPE_SECRET_KEY` unset
- **Steps:** Click Checkout
- **Expected result:** Error that Stripe is not configured

### TC-05: Checkout happy path

- **Priority:** High
- **Preconditions:** Stripe configured + webhook forwarder
- **Steps:**
  1. Checkout with test card
  2. Land on order success URL
- **Expected result:** Pending order created; webhook marks `paid`; appears on `/orders`

### TC-06: Order IDOR blocked

- **Priority:** High
- **Preconditions:** Two users; user A has an order
- **Steps:** User B visits `/orders/<A's id>`
- **Expected result:** 404 / not found

### TC-07: Non-admin cannot manage products

- **Priority:** High
- **Preconditions:** Signed in as `user`
- **Steps:** Visit `/admin/products`
- **Expected result:** Redirect away

## Edge Cases & Error States

- Empty cart checkout rejected
- Duplicate webhook events ignored via `stripe_event` PK

## Out of Scope

- Subscriptions / recurring billing beyond Customer Portal link
- Tax / shipping
