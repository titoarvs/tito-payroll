import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthEnabled } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with Google SSO or email. Google works once GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set."
    >
      <LoginForm
        googleEnabled={isGoogleAuthEnabled}
        nextPath={params.next || "/"}
      />
    </AuthShell>
  );
}
