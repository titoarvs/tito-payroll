"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface SiteHeaderNavProps {
  user: {
    name: string;
    role?: string | null;
  } | null;
}

const getFirstName = (name: string) => {
  const first = name.trim().split(/\s+/)[0];
  return first || "there";
};

export const SiteHeaderNav = ({ user }: SiteHeaderNavProps) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <nav className="flex items-center gap-2" aria-label="Primary">
        <Button asChild variant="ghost">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </nav>
    );
  }

  const isAdmin = user.role === "admin";
  const firstName = getFirstName(user.name);

  return (
    <nav className="flex items-center gap-2" aria-label="Primary">
      <p className="hidden text-sm text-foreground sm:block">
        Hello, <span className="font-medium">{firstName}</span>
      </p>
      <Button asChild variant="ghost">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      {isAdmin ? (
        <Button asChild variant="ghost">
          <Link href="/admin">Admin</Link>
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        aria-label="Sign out"
      >
        Log out
      </Button>
    </nav>
  );
};
