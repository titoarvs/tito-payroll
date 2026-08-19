export const sumCartCents = (
  items: { priceCents: number; quantity: number }[],
) => {
  return items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
};

export const formatMoney = (cents: number, currency = "usd") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

export const slugify = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};
