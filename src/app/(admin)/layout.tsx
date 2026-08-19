import { AppSidebar } from "@/components/shell/app-sidebar";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { getUnreadNotificationCount } from "@/features/notifications/actions";
import { requireAdmin } from "@/lib/require-admin";

const adminNavItems = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/users", label: "Users" },
  { href: "/audit", label: "Audit" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const unreadCount = await getUnreadNotificationCount(session.user.id);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AppSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        sectionLabel="admin"
        navAriaLabel="Admin"
        sidebarId="admin-sidebar"
        navItems={adminNavItems}
        headerAction={<NotificationBell unreadCount={unreadCount} />}
      />
      <main className="min-h-screen min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
