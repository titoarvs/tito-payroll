import { AppSidebar } from "@/components/shell/app-sidebar";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { getUnreadNotificationCount } from "@/features/notifications/actions";
import { requireSession } from "@/lib/require-admin";

const appNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/notifications", label: "Notifications" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/password", label: "Password" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const unreadCount = await getUnreadNotificationCount(session.user.id);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        sectionLabel="app"
        navAriaLabel="App"
        sidebarId="app-sidebar"
        navItems={appNavItems}
        headerAction={<NotificationBell unreadCount={unreadCount} />}
      />
      <main className="min-h-screen min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
