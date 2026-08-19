"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { addToCart } from "@/features/commerce/actions";

interface AddToCartButtonProps {
  productId: string;
}

export const AddToCartButton = ({ productId }: AddToCartButtonProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await addToCart({ productId, quantity: 1 });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/cart");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label="Add to cart"
      >
        {isPending ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  );
};
