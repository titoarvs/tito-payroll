import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { useCurrentUser, useLogout } from "~/hooks/use-current-user";
import type { HrisUser } from "~/lib/hris-auth";
import { cn } from "~/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

const isSuperAdmin = (user: HrisUser | undefined): boolean => {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.roles?.includes("super_admin") === true;
};

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

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2.5 13.8 9.2 20.5 11 13.8 12.8 12 19.5 10.2 12.8 3.5 11 10.2 9.2 12 2.5Z" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden="true"
  >
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden="true"
  >
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3.5 19.5c.8-3.2 2.9-5 5.5-5s4.7 1.8 5.5 5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M14.5 19.5c.5-2.2 1.8-3.5 3.5-3.5 1.5 0 2.6.9 3.2 2.5" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden="true"
  >
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5" />
    <path d="M4.5 16.5h15" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </svg>
);

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: GridIcon, exact: true },
  {
    to: "/dashboard/employees",
    label: "Employees",
    icon: UsersIcon,
    exact: false,
  },
] as const;

export const AppShell = ({ children }: AppShellProps) => {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isNavigating = useRouterState({
    select: (s) => s.isLoading || s.status === "pending",
  });
  const showSidenav = isSuperAdmin(user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isMenuOpen]);

  const handleToggleMenu = () => {
    setIsMenuOpen((open) => !open);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout.mutate();
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {showSidenav ? (
        <aside className="flex w-52 shrink-0 flex-col border-r border-border/60 bg-card px-3 py-4">
          <div className="mb-6 flex h-10 w-10 items-center justify-center text-foreground">
            <SparkleIcon className="h-6 w-6" />
          </div>
          <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-100 text-violet-700 shadow-[0_0_0_1px_rgba(139,92,246,0.15)] dark:bg-violet-950/70 dark:text-violet-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-16 items-center justify-between border-b border-border/40 bg-card/80 px-6 backdrop-blur-sm">
          {isNavigating ? (
            <div
              className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden"
              role="status"
              aria-label="Loading page"
            >
              <div className="h-full w-1/3 animate-[nav-progress_1s_ease-in-out_infinite] bg-accent" />
            </div>
          ) : null}
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Payroll
          </h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold text-foreground transition-colors hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-800"
                aria-label="User menu"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                onClick={handleToggleMenu}
              >
                {user && isHttpImage(user.image) ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user ? initialsFrom(user) : "…"}</span>
                )}
              </button>
              {isMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-border bg-popover p-1 shadow-lg"
                >
                  {user ? (
                    <p className="truncate px-3 py-2 text-xs text-muted-foreground">
                      {displayName(user)}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    onClick={handleLogout}
                    disabled={logout.isPending}
                  >
                    {logout.isPending ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};
