import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { HrisApiError } from "~/lib/hris-api-client";
import {
  getGoogleSignInUrl,
  hasHrisSession,
  loginWithPassword,
  verifyMfa,
} from "~/lib/hris-auth";

const EyeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
    <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.1" />
    <path d="M6.1 6.1C3.7 8 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 3.1-.5" />
  </svg>
);

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
    if (!mfaToken) {
      return;
    }

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
    <main className="relative flex flex-1 flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in to Tito Payroll
          </h1>
          <p className="text-sm text-muted-foreground">
            Use your HRIS account (same users as T201).
          </p>
        </header>

        {authError || googleErrorMessage ? (
          <Alert variant="error">{authError || googleErrorMessage}</Alert>
        ) : null}

        {mfaToken ? (
          <form className="space-y-4" onSubmit={handleMfaSubmit}>
            <div className="space-y-2">
              <Label htmlFor="mfa-code">Authentication code</Label>
              <Input
                id="mfa-code"
                name="mfa-code"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                aria-label="MFA authentication code"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancelMfa}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Verifying…" : "Verify"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              aria-label="Continue with Google"
            >
              {isSubmitting ? "Signing in…" : "Continue with Google"}
            </Button>

            <div className="relative text-center text-xs text-muted-foreground">
              <span className="bg-card px-2">or email</span>
              <div
                className="absolute inset-x-0 top-1/2 -z-10 border-t border-border"
                aria-hidden="true"
              />
            </div>

            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-label="Email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-10"
                    aria-label="Password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      isPasswordVisible ? "Hide password" : "Show password"
                    }
                    onClick={() =>
                      setIsPasswordVisible((isVisible) => !isVisible)
                    }
                    disabled={isSubmitting}
                  >
                    {isPasswordVisible ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
