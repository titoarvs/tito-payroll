import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="We'll email a reset link. Without Resend configured, the link is printed to the server console."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
