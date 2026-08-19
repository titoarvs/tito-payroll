"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProduct,
  updateProduct,
} from "@/features/commerce/actions";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initial?: {
    name: string;
    description: string;
    priceCents: number;
    currency: string;
    slug: string;
    isActive: boolean;
  };
}

export const ProductForm = ({ mode, productId, initial }: ProductFormProps) => {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceDollars, setPriceDollars] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : "",
  );
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const priceCents = Math.round(Number(priceDollars) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a valid price");
      return;
    }

    startTransition(async () => {
      const payload = {
        name,
        description,
        priceCents,
        currency: initial?.currency ?? "usd",
        slug: slug || undefined,
        isActive,
      };
      const result =
        mode === "create"
          ? await createProduct(payload)
          : await updateProduct(productId!, payload);

      if (result.error) {
        setError(result.error);
        return;
      }
      if (mode === "create" && "productId" in result && result.productId) {
        router.push(`/admin/products/${result.productId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-white p-5"
    >
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-label="Product name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from name"
          aria-label="Product slug"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Product description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (USD)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0.01"
          value={priceDollars}
          onChange={(e) => setPriceDollars(e.target.value)}
          required
          aria-label="Product price in dollars"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active in shop
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : mode === "create" ? "Create product" : "Save"}
      </Button>
    </form>
  );
};
