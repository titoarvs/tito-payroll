import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="space-y-4 animate-rise">
      <h1 className="font-display text-3xl font-semibold text-ink">
        User not found
      </h1>
      <p className="text-sm text-muted-foreground">
        That user does not exist or was removed.
      </p>
      <Link
        href="/users"
        className="inline-flex font-mono text-sm text-accent underline-offset-4 hover:underline"
      >
        ← Back to users
      </Link>
    </div>
  );
}
