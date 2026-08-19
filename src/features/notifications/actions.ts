"use server";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { notification } from "@/db/schema/notification";
import { requireSession } from "@/lib/require-admin";

export const getUnreadNotificationCount = async (userId: string) => {
  const [row] = await db
    .select({ value: count() })
    .from(notification)
    .where(
      and(eq(notification.userId, userId), isNull(notification.readAt)),
    );
  return row?.value ?? 0;
};

export const listNotifications = async (userId: string) => {
  return db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(50);
};

export const markRead = async (input: { notificationId: string }) => {
  const session = await requireSession();
  const parsed = z
    .object({ notificationId: z.string().uuid() })
    .safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid notification" };
  }

  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.id, parsed.data.notificationId),
        eq(notification.userId, session.user.id),
      ),
    );

  revalidatePath("/notifications");
  return { success: true as const };
};

export const markAllRead = async () => {
  const session = await requireSession();
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.userId, session.user.id),
        isNull(notification.readAt),
      ),
    );
  revalidatePath("/notifications");
  return { success: true as const };
};
