import { ProfileForm } from "@/features/account/profile-form";
import { isStorageConfigured } from "@/lib/storage";
import { requireSession } from "@/lib/require-admin";

export default async function ProfileSettingsPage() {
  const session = await requireSession();

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          settings
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Update how your name appears across the app.
        </p>
      </div>

      <ProfileForm
        name={session.user.name}
        email={session.user.email}
        image={session.user.image ?? null}
        storageConfigured={isStorageConfigured()}
      />
    </div>
  );
}
