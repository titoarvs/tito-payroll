import { db } from "@/db";
import { analyticsEvent } from "@/db/schema/analytics";

export {
  bucketByDay,
  rangeToDays,
  type AnalyticsRange,
} from "@/lib/analytics-range";

interface TrackInput {
  name: string;
  userId?: string | null;
  anonId?: string | null;
  path?: string | null;
  referrer?: string | null;
  props?: Record<string, unknown>;
}

export const track = async (input: TrackInput) => {
  try {
    await db.insert(analyticsEvent).values({
      name: input.name,
      userId: input.userId ?? null,
      anonId: input.anonId ?? null,
      path: input.path ?? null,
      referrer: input.referrer ?? null,
      props: input.props ?? null,
    });
  } catch (error) {
    console.error("[analytics] track failed", error);
  }
};
