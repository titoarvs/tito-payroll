import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/features/commerce/add-to-cart-button";
import { formatMoney } from "@/features/commerce/money";
import { findActiveProductBySlug } from "@/features/commerce/queries";
import { requireSession } from "@/lib/require-admin";

interface ShopProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ShopProductPage({
  params,
}: ShopProductPageProps) {
  await requireSession();
  const { slug } = await params;
  const item = await findActiveProductBySlug(slug);
  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <Link
          href="/shop"
          className="font-mono text-xs text-accent underline-offset-4 hover:underline"
        >
          ← Shop
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          {item.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
        <p className="mt-4 font-mono text-lg">
          {formatMoney(item.priceCents, item.currency)}
        </p>
      </div>
      <AddToCartButton productId={item.id} />
    </div>
  );
}
