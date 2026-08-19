import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { isGoogleAuthEnabled } from "@/lib/env";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start with Google SSO or email/password. Emails listed in ADMIN_EMAILS become admin on first sign-up."
    >
      <SignupForm googleEnabled={isGoogleAuthEnabled} />
    </AuthShell>
  );
}
