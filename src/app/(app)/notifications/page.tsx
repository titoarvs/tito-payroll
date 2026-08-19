import { NotificationsList } from "@/features/notifications/notifications-list";
import { listNotifications } from "@/features/notifications/actions";
import { requireSession } from "@/lib/require-admin";

export default async function NotificationsPage() {
  const session = await requireSession();
  const items = await listNotifications(session.user.id);

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          inbox
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Notifications
        </h1>
      </div>
      <NotificationsList items={items} />
    </div>
  );
}
