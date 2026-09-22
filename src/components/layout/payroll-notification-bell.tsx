import { Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "~/hooks/use-notifications";
import { cn } from "~/lib/utils";

const resolveNotificationTo = (
  type: string,
  link: string | null,
): string | null => {
  if (link) return link;
  if (
    type === "pay-run-computed" ||
    type === "pay-run-missing-data" ||
    type === "pay-run-approval-reminder-7" ||
    type === "pay-run-approval-reminder-2" ||
    type === "pay-run-approval-overdue"
  ) {
    return "/dashboard/pay-runs";
  }
  if (type === "payslip-released") return "/dashboard/my-payslips";
  if (type === "holiday-work-unfiled-reminder") return "/dashboard";
  return null;
};

export const PayrollNotificationBell = () => {
  const { data: listData, isPending } = useNotifications();
  const { data: unreadData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = listData?.data ?? [];
  const unreadCount = unreadData?.data?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[min(20rem,calc(100vh-8rem))] overflow-y-auto">
          {isPending ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : null}
          {!isPending && notifications.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : null}
          {!isPending
            ? notifications.map((notification) => {
                const to = resolveNotificationTo(
                  notification.type,
                  notification.link,
                );
                const body =
                  notification.content ||
                  notification.body ||
                  notification.title;
                const itemClass = cn(
                  "flex cursor-pointer flex-col items-start gap-0.5 whitespace-normal",
                  !notification.isRead && "bg-muted/40",
                );

                if (to) {
                  return (
                    <DropdownMenuItem key={notification.id} asChild>
                      <a
                        href={to}
                        className={itemClass}
                        onClick={() => {
                          if (!notification.isRead) {
                            markRead.mutate(notification.id);
                          }
                        }}
                      >
                        <span className="text-sm font-medium">
                          {notification.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {body}
                        </span>
                      </a>
                    </DropdownMenuItem>
                  );
                }

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={itemClass}
                    onClick={() => {
                      if (!notification.isRead) {
                        markRead.mutate(notification.id);
                      }
                    }}
                  >
                    <span className="text-sm font-medium">
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{body}</span>
                  </DropdownMenuItem>
                );
              })
            : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
