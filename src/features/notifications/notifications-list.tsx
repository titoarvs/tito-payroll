"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markAllRead, markRead } from "@/features/notifications/actions";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}

interface NotificationsListProps {
  items: NotificationRow[];
}

export const NotificationsList = ({ items }: NotificationsListProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllRead();
      router.refresh();
    });
  };

  const handleMarkOne = (notificationId: string) => {
    startTransition(async () => {
      await markRead({ notificationId });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending || items.every((item) => item.readAt)}
          onClick={handleMarkAll}
        >
          Mark all read
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  {item.body ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  ) : null}
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    {item.createdAt.toLocaleString()}
                    {item.readAt ? " · read" : " · unread"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.href ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.href}>Open</Link>
                    </Button>
                  ) : null}
                  {!item.readAt ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleMarkOne(item.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
