import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  PAYROLL_NAV_ITEMS,
  type PayrollNavItem,
} from "~/config/payroll-navigation";
import { useCurrentUser, useLogout } from "~/hooks/use-current-user";
import type { HrisUser } from "~/lib/hris-auth";
import { cn } from "~/lib/utils";

const userRoles = (user: HrisUser | undefined): string[] => {
  if (!user) return [];
  const roles = new Set<string>();
  if (user.role) roles.add(user.role);
  for (const role of user.roles ?? []) roles.add(role);
  return [...roles];
};

const hasPayrollOps = (user: HrisUser | undefined): boolean =>
  userRoles(user).some((role) =>
    ["super_admin", "admin", "finance"].includes(role),
  );

const displayName = (user: HrisUser): string => {
  const fromParts = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fromParts || user.name || user.email;
};

const initialsFrom = (user: HrisUser): string => {
  const name = displayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const isHttpImage = (image: string | null | undefined): image is string =>
  typeof image === "string" && /^https?:\/\//i.test(image);

const isNavActive = (pathname: string, item: PayrollNavItem): boolean =>
  item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);

export const PayrollHeader = () => {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavigating = useRouterState({
    select: (s) => s.isLoading || s.status === "pending",
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOps = hasPayrollOps(user);
  const navItems = PAYROLL_NAV_ITEMS.filter(
    (item) => !item.requiresPayrollOps || isOps,
  );

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <header className="glass-nav sticky top-0 z-20">
      {isNavigating ? (
        <div
          className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden"
          role="status"
          aria-label="Loading page"
        >
          <div className="h-full w-1/3 animate-nav-progress bg-primary" />
        </div>
      ) : null}

      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="border-b border-sidebar-border px-4 py-4">
                <SheetTitle className="text-left">
                  <span className="font-mont text-sidebar-foreground">
                    Tito Payroll
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-2" aria-label="Mobile">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ModeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
                aria-label="User menu"
              >
                <Avatar className="h-9 w-9">
                  {user && isHttpImage(user.image) ? (
                    <AvatarImage src={user.image} alt="" />
                  ) : null}
                  <AvatarFallback>{user ? initialsFrom(user) : "…"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate font-normal">
                    {displayName(user)}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut className="h-4 w-4" />
                {logout.isPending ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
