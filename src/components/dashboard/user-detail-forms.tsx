"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  banUser,
  resetUserPassword,
  setUserRole,
  unbanUser,
} from "@/app/(admin)/users/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserRoleFormProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export const UserRoleForm = ({
  userId,
  currentRole,
  isSelf,
}: UserRoleFormProps) => {
  const router = useRouter();
  const [role, setRole] = useState(currentRole === "admin" ? "admin" : "user");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await setUserRole({
        userId,
        role: role as "admin" | "user",
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Role updated.");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-white p-5"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Admins can manage users and view the audit trail.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={role}
          disabled={isSelf || isPending}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        {isSelf ? (
          <p className="text-xs text-muted-foreground">
            You cannot change your own role here.
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSelf || isPending || role === currentRole}>
        {isPending ? "Saving…" : "Save role"}
      </Button>
    </form>
  );
};

interface UserPasswordFormProps {
  userId: string;
  userName: string;
}

export const UserPasswordForm = ({
  userId,
  userName,
}: UserPasswordFormProps) => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await resetUserPassword({ userId, newPassword });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Password reset.");
      setNewPassword("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-white p-5"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Reset password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a new password for {userName}. This is written to the audit trail.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          minLength={8}
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-label={`New password for ${userName}`}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>

      <Button
        type="submit"
        disabled={isPending || newPassword.length < 8}
      >
        {isPending ? "Saving…" : "Reset password"}
      </Button>
    </form>
  );
};

interface UserBanFormProps {
  userId: string;
  userName: string;
  isBanned: boolean;
  isSelf: boolean;
  banReason?: string | null;
}

export const UserBanForm = ({
  userId,
  userName,
  isBanned,
  isSelf,
  banReason,
}: UserBanFormProps) => {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleBan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await banUser({
        userId,
        banReason: reason || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("User banned.");
      setReason("");
      router.refresh();
    });
  };

  const handleUnban = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await unbanUser({ userId });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("User unbanned.");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleBan}
      className="space-y-4 rounded-xl border border-border bg-white p-5"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Ban status
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isBanned
            ? `${userName} is banned${banReason ? `: ${banReason}` : "."}`
            : `Ban ${userName} from signing in.`}
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}

      {isBanned ? (
        <Button
          type="button"
          variant="outline"
          disabled={isPending || isSelf}
          onClick={handleUnban}
        >
          {isPending ? "Working…" : "Unban user"}
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="banReason">Reason (optional)</Label>
            <Input
              id="banReason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={isSelf || isPending}
              aria-label="Ban reason"
            />
          </div>
          <Button type="submit" variant="destructive" disabled={isSelf || isPending}>
            {isPending ? "Banning…" : "Ban user"}
          </Button>
        </>
      )}
      {isSelf ? (
        <p className="text-xs text-muted-foreground">
          You cannot ban yourself.
        </p>
      ) : null}
    </form>
  );
};
