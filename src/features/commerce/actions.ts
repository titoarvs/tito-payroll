"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import {
  cartItem,
  customer,
  order,
  orderItem,
  product,
} from "@/db/schema/commerce";
import { writeAuditLog } from "@/lib/audit-writer";
import { env } from "@/lib/env";
import { requireAdmin, requireSession } from "@/lib/require-admin";
import { getStripe } from "@/lib/stripe";
import { slugify } from "@/features/commerce/money";
import {
  clearCart,
  getCartWithItems,
  getOrCreateCart,
} from "@/features/commerce/queries";

const productIdSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
});

const cartItemIdSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0).max(99),
});

const productInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  priceCents: z.number().int().positive(),
  currency: z.string().trim().min(3).max(3).default("usd"),
  slug: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().default(true),
  imageFileId: z.string().uuid().nullable().optional(),
});

export const addToCart = async (input: z.infer<typeof productIdSchema>) => {
  const session = await requireSession();
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [active] = await db
    .select()
    .from(product)
    .where(
      and(eq(product.id, parsed.data.productId), eq(product.isActive, true)),
    )
    .limit(1);
  if (!active) {
    return { error: "Product not found" };
  }

  const userCart = await getOrCreateCart(session.user.id);
  const [existing] = await db
    .select()
    .from(cartItem)
    .where(
      and(
        eq(cartItem.cartId, userCart.id),
        eq(cartItem.productId, active.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(cartItem)
      .set({ quantity: existing.quantity + parsed.data.quantity })
      .where(eq(cartItem.id, existing.id));
  } else {
    await db.insert(cartItem).values({
      cartId: userCart.id,
      productId: active.id,
      quantity: parsed.data.quantity,
    });
  }

  revalidatePath("/cart");
  revalidatePath("/shop");
  return { success: true as const };
};

export const updateCartItem = async (
  input: z.infer<typeof cartItemIdSchema>,
) => {
  const session = await requireSession();
  const parsed = cartItemIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { cart: userCart } = await getCartWithItems(session.user.id);
  const [item] = await db
    .select()
    .from(cartItem)
    .where(
      and(
        eq(cartItem.id, parsed.data.cartItemId),
        eq(cartItem.cartId, userCart.id),
      ),
    )
    .limit(1);

  if (!item) {
    return { error: "Cart item not found" };
  }

  if (parsed.data.quantity === 0) {
    await db.delete(cartItem).where(eq(cartItem.id, item.id));
  } else {
    await db
      .update(cartItem)
      .set({ quantity: parsed.data.quantity })
      .where(eq(cartItem.id, item.id));
  }

  revalidatePath("/cart");
  return { success: true as const };
};

const ensureStripeCustomer = async (userId: string, email: string) => {
  const [existing] = await db
    .select()
    .from(customer)
    .where(eq(customer.userId, userId))
    .limit(1);
  if (existing) {
    return existing.stripeCustomerId;
  }

  const stripe = getStripe();
  const created = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await db.insert(customer).values({
    userId,
    stripeCustomerId: created.id,
  });
  return created.id;
};

export const createCheckoutSession = async () => {
  const session = await requireSession();
  if (!env.STRIPE_SECRET_KEY) {
    return { error: "Stripe is not configured. Set STRIPE_SECRET_KEY." };
  }

  const { cart: userCart, items, totalCents } = await getCartWithItems(
    session.user.id,
  );
  const activeItems = items.filter((item) => item.isActive);
  if (activeItems.length === 0) {
    return { error: "Your cart is empty" };
  }

  const stripeCustomerId = await ensureStripeCustomer(
    session.user.id,
    session.user.email,
  );

  const [pendingOrder] = await db
    .insert(order)
    .values({
      userId: session.user.id,
      status: "pending",
      currency: activeItems[0]?.currency ?? env.DEFAULT_CURRENCY,
      totalCents,
    })
    .returning();

  await db.insert(orderItem).values(
    activeItems.map((item) => ({
      orderId: pendingOrder.id,
      productId: item.productId,
      name: item.name,
      unitAmountCents: item.priceCents,
      quantity: item.quantity,
      currency: item.currency,
    })),
  );

  const stripe = getStripe();
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: activeItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: item.currency,
        unit_amount: item.priceCents,
        product_data: { name: item.name },
      },
    })),
    success_url: `${env.BETTER_AUTH_URL}/orders/${pendingOrder.id}?paid=1`,
    cancel_url: `${env.BETTER_AUTH_URL}/cart?canceled=1`,
    metadata: {
      orderId: pendingOrder.id,
      userId: session.user.id,
    },
  });

  await db
    .update(order)
    .set({ stripeSessionId: checkout.id })
    .where(eq(order.id, pendingOrder.id));

  await clearCart(userCart.id);
  revalidatePath("/cart");
  revalidatePath("/orders");

  if (!checkout.url) {
    return { error: "Stripe did not return a checkout URL" };
  }

  redirect(checkout.url);
};

export const createBillingPortalSession = async () => {
  const session = await requireSession();
  if (!env.STRIPE_SECRET_KEY) {
    return { error: "Stripe is not configured." };
  }

  const [row] = await db
    .select()
    .from(customer)
    .where(eq(customer.userId, session.user.id))
    .limit(1);
  if (!row) {
    return { error: "No billing customer yet. Complete a purchase first." };
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${env.BETTER_AUTH_URL}/orders`,
  });
  redirect(portal.url);
};

export const createProduct = async (
  input: z.infer<typeof productInputSchema>,
) => {
  const session = await requireAdmin();
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
  if (!slug) {
    return { error: "Slug is required" };
  }

  try {
    const [created] = await db
      .insert(product)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        currency: parsed.data.currency.toLowerCase(),
        slug,
        isActive: parsed.data.isActive,
        imageFileId: parsed.data.imageFileId ?? null,
      })
      .returning();

    await writeAuditLog({
      action: "product_created",
      actorId: session.user.id,
      actorEmail: session.user.email,
      metadata: { productId: created.id, slug: created.slug },
    });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return { success: true as const, productId: created.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
};

export const updateProduct = async (
  productId: string,
  input: z.infer<typeof productInputSchema>,
) => {
  const session = await requireAdmin();
  const idParsed = z.string().uuid().safeParse(productId);
  const parsed = productInputSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { error: "Invalid input" };
  }

  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);

  try {
    await db
      .update(product)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        currency: parsed.data.currency.toLowerCase(),
        slug,
        isActive: parsed.data.isActive,
        imageFileId: parsed.data.imageFileId ?? null,
      })
      .where(eq(product.id, idParsed.data));

    await writeAuditLog({
      action: "product_updated",
      actorId: session.user.id,
      actorEmail: session.user.email,
      metadata: { productId: idParsed.data, slug },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${idParsed.data}`);
    revalidatePath("/shop");
    return { success: true as const };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
};
