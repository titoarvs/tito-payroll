import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { cart, cartItem, product } from "@/db/schema/commerce";
import { sumCartCents } from "@/features/commerce/money";

export const getOrCreateCart = async (userId: string) => {
  const [existing] = await db
    .select()
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);
  if (existing) {
    return existing;
  }
  const [created] = await db.insert(cart).values({ userId }).returning();
  return created;
};

export const getCartWithItems = async (userId: string) => {
  const userCart = await getOrCreateCart(userId);
  const items = await db
    .select({
      id: cartItem.id,
      quantity: cartItem.quantity,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: product.priceCents,
      currency: product.currency,
      isActive: product.isActive,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .where(eq(cartItem.cartId, userCart.id));

  return {
    cart: userCart,
    items,
    totalCents: sumCartCents(items),
  };
};

export const clearCart = async (cartId: string) => {
  await db.delete(cartItem).where(eq(cartItem.cartId, cartId));
};

export const findActiveProductBySlug = async (slug: string) => {
  const [row] = await db
    .select()
    .from(product)
    .where(and(eq(product.slug, slug), eq(product.isActive, true)))
    .limit(1);
  return row ?? null;
};
