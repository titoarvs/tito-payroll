export type AnalyticsRange = "7d" | "30d" | "90d";

export const rangeToDays = (range: AnalyticsRange) => {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
};

export const bucketByDay = (
  rows: { day: string; count: number }[],
  days: number,
) => {
  const map = new Map(rows.map((row) => [row.day, row.count]));
  const buckets: { day: string; count: number }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets.push({ day: key, count: map.get(key) ?? 0 });
  }
  return buckets;
};
