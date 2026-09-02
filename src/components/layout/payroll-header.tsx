import { useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { TitoLogo } from "~/components/branding/TitoLogo";
import { PayrollNavLinks } from "~/components/layout/payroll-nav-links";
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
import { PAYROLL_NAV_ITEMS } from "~/config/payroll-navigation";
import { useCurrentUser, useLogout } from "~/hooks/use-current-user";
import type { HrisUser } from "~/lib/hris-auth";

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

const roleLabel = (user: HrisUser): string => {
  const role = user.role || user.roles?.[0];
  if (!role) return "User";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
            <SheetContent side="left" className="gap-0 p-0">
              <SheetHeader className="border-b border-sidebar-border px-4 py-4">
                <SheetTitle className="text-left">
                  <TitoLogo size="sm" variant="sidebar" />
                </SheetTitle>
              </SheetHeader>
              <nav
                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-4"
                aria-label="Mobile"
              >
                <PayrollNavLinks
                  items={navItems}
                  pathname={pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
              </nav>
              <div className="mt-auto border-t border-sidebar-border px-4 py-4">
                <p className="text-[11px] text-muted-foreground">
                  © {new Date().getFullYear()} Tito
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ModeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-md text-muted-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto gap-2 rounded-md px-1.5 py-1 pr-2"
                aria-label="User menu"
              >
                <Avatar className="h-9 w-9">
                  {user && isHttpImage(user.image) ? (
                    <AvatarImage src={user.image} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {user ? initialsFrom(user) : "…"}
                  </AvatarFallback>
                </Avatar>
                {user ? (
                  <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
                    <span className="max-w-[9rem] truncate text-sm font-medium leading-tight text-foreground">
                      {displayName(user)}
                    </span>
                    <span className="max-w-[9rem] truncate text-xs leading-tight text-muted-foreground">
                      {roleLabel(user)}
                    </span>
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-md">
              {user ? (
                <>
                  <DropdownMenuLabel className="space-y-0.5 font-normal">
                    <p className="truncate text-sm font-medium">
                      {displayName(user)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {roleLabel(user)}
                    </p>
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
