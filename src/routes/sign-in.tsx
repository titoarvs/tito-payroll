import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PayrollSignInCard } from "~/components/auth/payroll-sign-in-card";
import { ModeToggle } from "~/components/mode-toggle";
import { HrisApiError } from "~/lib/hris-api-client";
import {
  getGoogleSignInUrl,
  hasHrisSession,
  loginWithPassword,
  verifyMfa,
} from "~/lib/hris-auth";

export const Route = createFileRoute("/sign-in")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { error?: string } => {
    const error = typeof search.error === "string" ? search.error : undefined;
    return error ? { error } : {};
  },
  beforeLoad: () => {
    if (hasHrisSession()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  const { error: signInError } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleErrorMessage =
    signInError === "google_login_failed"
      ? "Google sign-in failed. Please try again."
      : signInError
        ? "Sign-in failed. Please try again."
        : null;

  const handleLoginResult = async (
    result: Awaited<ReturnType<typeof loginWithPassword>>,
  ) => {
    if ("mfaRequired" in result) {
      setMfaToken(result.mfaToken);
      return;
    }
    await navigate({ to: "/dashboard" });
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setIsSubmitting(true);

    try {
      const result = await loginWithPassword({
        email: email.trim(),
        password,
      });
      await handleLoginResult(result);
    } catch (error) {
      setAuthError(
        error instanceof HrisApiError
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    setAuthError("");
    setIsSubmitting(true);
    window.location.assign(getGoogleSignInUrl());
  };

  const handleMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaToken) return;

    setAuthError("");
    setIsSubmitting(true);

    try {
      await verifyMfa(mfaToken, mfaCode.trim());
      await navigate({ to: "/dashboard" });
    } catch (error) {
      setAuthError(
        error instanceof HrisApiError
          ? error.message
          : "Invalid MFA code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMfa = () => {
    setMfaToken(null);
    setMfaCode("");
    setAuthError("");
  };

  return (
    <main className="auth-page relative flex min-h-screen flex-col items-center justify-center p-6">
      <div aria-hidden className="noise-overlay" />
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>
      <PayrollSignInCard
        email={email}
        password={password}
        isPasswordVisible={isPasswordVisible}
        mfaToken={mfaToken}
        mfaCode={mfaCode}
        authError={authError}
        googleErrorMessage={googleErrorMessage}
        isSubmitting={isSubmitting}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTogglePasswordVisibility={() =>
          setIsPasswordVisible((isVisible) => !isVisible)
        }
        onMfaCodeChange={setMfaCode}
        onLoginSubmit={handleLoginSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        onMfaSubmit={handleMfaSubmit}
        onCancelMfa={handleCancelMfa}
        className="relative z-10"
      />
    </main>
  );
}
