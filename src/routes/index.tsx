import { createFileRoute, redirect } from "@tanstack/react-router";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useCurrentUser, useLogout } from "~/hooks/use-current-user";
import { hasHrisSession } from "~/lib/hris-auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (!hasHrisSession()) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: HomePage,
});

const displayName = (user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
}) => {
  const fromParts = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fromParts || user.name || user.email;
};

function HomePage() {
  const { data: user, isLoading, isError, error } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Tito Payroll
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in via{" "}
            <code className="font-mono text-xs">tito-hris-api</code>. No local
            database.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        ) : null}

        {isError ? (
          <Alert variant="error">
            {error instanceof Error
              ? error.message
              : "Failed to load current user."}
          </Alert>
        ) : null}

        {user ? (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">
                {displayName(user)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Roles</dt>
              <dd className="font-medium text-foreground">
                {(user.roles?.length ? user.roles : [user.role].filter(Boolean))
                  .join(", ") || "—"}
              </dd>
            </div>
          </dl>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          disabled={logout.isPending}
          aria-label="Sign out"
        >
          {logout.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </main>
  );
}
