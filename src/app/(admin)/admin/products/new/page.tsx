import Link from "next/link";

import { ProductForm } from "@/features/commerce/product-form";
import { requireAdmin } from "@/lib/require-admin";

export default async function NewProductPage() {
  await requireAdmin();

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
          New product
        </h1>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
