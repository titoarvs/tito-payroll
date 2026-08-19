import { NextResponse } from "next/server";
import { z } from "zod";

import { track } from "@/lib/analytics";

export const runtime = "nodejs";

const eventSchema = z.object({
  name: z.string().trim().min(1).max(64),
  path: z.string().trim().max(500).optional(),
  referrer: z.string().trim().max(500).optional(),
  anonId: z.string().trim().max(64).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

// ponytail: in-memory per-IP throttle — fine for single-instance; upgrade to Redis when multi-node.
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 60;

const isThrottled = (ip: string) => {
  const now = Date.now();
  const current = hits.get(ip);
  if (!current || current.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_HITS;
};

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isThrottled(ip)) {
      return NextResponse.json({ ok: true, throttled: true });
    }

    const json = await request.json();
    const parsed = eventSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await track({
      name: parsed.data.name,
      path: parsed.data.path,
      referrer: parsed.data.referrer,
      anonId: parsed.data.anonId,
      props: parsed.data.props,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
