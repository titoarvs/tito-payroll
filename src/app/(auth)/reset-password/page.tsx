import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Choose a new password"
      description={
        params.error
          ? "This reset link is invalid or expired. Request a new one from the forgot-password page."
          : "Enter a new password for your account."
      }
    >
      <ResetPasswordForm token={params.token ?? ""} />
    </AuthShell>
  );
}
