import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ProductForm } from "@/features/commerce/product-form";
import { db } from "@/db";
import { product } from "@/db/schema/commerce";
import { requireAdmin } from "@/lib/require-admin";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  await requireAdmin();
  const { id } = await params;
  const [row] = await db
    .select()
    .from(product)
    .where(eq(product.id, id))
    .limit(1);
  if (!row) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <Link
          href="/admin/products"
          className="font-mono text-xs text-accent underline-offset-4 hover:underline"
        >
          ← Products
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          Edit product
        </h1>
      </div>
      <ProductForm
        mode="edit"
        productId={row.id}
        initial={{
          name: row.name,
          description: row.description,
          priceCents: row.priceCents,
          currency: row.currency,
          slug: row.slug,
          isActive: row.isActive,
        }}
      />
    </div>
  );
}
