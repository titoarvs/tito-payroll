import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { db } from "@/db";
import { order, stripeEvent } from "@/db/schema/commerce";
import { user } from "@/db/schema/auth";
import { writeAuditLog } from "@/lib/audit-writer";
import { track } from "@/lib/analytics";
import { orderReceiptEmail } from "@/lib/emails/templates";
import { formatMoney } from "@/features/commerce/money";
import { env } from "@/lib/env";
import { notify } from "@/lib/notify";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const markOrderPaid = async (session: Stripe.Checkout.Session) => {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    return;
  }

  const [existing] = await db
    .select()
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);
  if (!existing || existing.status === "paid") {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await db
    .update(order)
    .set({
      status: "paid",
      stripePaymentIntentId: paymentIntentId ?? null,
    })
    .where(eq(order.id, orderId));

  await writeAuditLog({
    action: "order_paid",
    actorId: existing.userId,
    targetUserId: existing.userId,
    metadata: {
      orderId,
      totalCents: existing.totalCents,
      stripeSessionId: session.id,
    },
  });

  await track({
    name: "purchase",
    userId: existing.userId,
    props: {
      orderId,
      totalCents: existing.totalCents,
      currency: existing.currency,
    },
  });

  try {
    const [buyer] = await db
      .select({ name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, existing.userId))
      .limit(1);
    if (buyer) {
      const totalLabel = formatMoney(existing.totalCents, existing.currency);
      const template = orderReceiptEmail({
        name: buyer.name,
        orderId,
        totalLabel,
      });
      await notify({
        userId: existing.userId,
        type: "order_paid",
        title: "Order paid",
        body: `Your order totaling ${totalLabel} is confirmed.`,
        href: `/orders/${orderId}`,
        email: {
          to: buyer.email,
          ...template,
        },
      });
    }
  } catch (error) {
    console.error("[stripe] order notify failed", error);
  }
};

export async function POST(request: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid webhook signature",
      },
      { status: 400 },
    );
  }

  try {
    await db.insert(stripeEvent).values({
      id: event.id,
      type: event.type,
    });
  } catch {
    // Duplicate event id — already processed
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    await markOrderPaid(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
