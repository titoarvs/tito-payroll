import { config } from "dotenv";
import { count, eq } from "drizzle-orm";

config({ path: ".env.local" });
config();

async function main() {
  const { db } = await import("../src/db");
  const { product } = await import("../src/db/schema/commerce");
  const { analyticsEvent } = await import("../src/db/schema/analytics");

  const samples = [
    {
      slug: "starter-sticker",
      name: "Starter sticker",
      description: "Ship-ready vinyl for your laptop.",
      priceCents: 500,
      currency: "usd",
      isActive: true,
    },
    {
      slug: "deploy-hoodie",
      name: "Deploy hoodie",
      description: "Warm layers for cold production nights.",
      priceCents: 4900,
      currency: "usd",
      isActive: true,
    },
    {
      slug: "audit-notebook",
      name: "Audit notebook",
      description: "Paper trail, literally.",
      priceCents: 1200,
      currency: "usd",
      isActive: true,
    },
  ];

  for (const sample of samples) {
    const [existing] = await db
      .select({ id: product.id })
      .from(product)
      .where(eq(product.slug, sample.slug))
      .limit(1);
    if (!existing) {
      await db.insert(product).values(sample);
      console.info(`[seed] product ${sample.slug}`);
    } else {
      console.info(`[seed] skip existing ${sample.slug}`);
    }
  }

  const [eventCount] = await db
    .select({ value: count() })
    .from(analyticsEvent);

  if ((eventCount?.value ?? 0) < 5) {
    const today = new Date();
    for (let i = 0; i < 10; i += 1) {
      const createdAt = new Date(today);
      createdAt.setUTCDate(today.getUTCDate() - (i % 7));
      await db.insert(analyticsEvent).values({
        name: "page_view",
        path: i % 2 === 0 ? "/dashboard" : "/shop",
        anonId: `seed-${i}`,
        createdAt,
      });
    }
    console.info("[seed] sample analytics events");
  } else {
    console.info("[seed] analytics already populated");
  }

  console.info(
    "[seed] done. Sign up with an ADMIN_EMAILS address for an admin user.",
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
