import { PasswordForm } from "@/features/account/password-form";
import { requireSession } from "@/lib/require-admin";

export default async function PasswordSettingsPage() {
  await requireSession();

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          settings
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Change the password for your email/password account.
        </p>
      </div>

      <PasswordForm />
    </div>
  );
}
