"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  createBillingPortalSession,
  createCheckoutSession,
  updateCartItem,
} from "@/features/commerce/actions";

export const CheckoutButton = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await createCheckoutSession();
        });
      }}
      aria-label="Checkout with Stripe"
    >
      {isPending ? "Redirecting…" : "Checkout"}
    </Button>
  );
};

export const BillingPortalButton = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await createBillingPortalSession();
        });
      }}
      aria-label="Open Stripe customer portal"
    >
      {isPending ? "Opening…" : "Billing portal"}
    </Button>
  );
};

interface CartQuantityControlsProps {
  cartItemId: string;
  quantity: number;
}

export const CartQuantityControls = ({
  cartItemId,
  quantity,
}: CartQuantityControlsProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (next: number) => {
    startTransition(async () => {
      await updateCartItem({ cartItemId, quantity: next });
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleUpdate(quantity - 1)}
        aria-label="Decrease quantity"
      >
        −
      </Button>
      <span className="w-6 text-center text-sm">{quantity}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => handleUpdate(quantity + 1)}
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  );
};
