import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requestGoogleIdToken } from "~/lib/google-identity";
import { HrisApiError } from "~/lib/hris-api-client";
import {
  hasHrisSession,
  loginWithGoogle,
  loginWithPassword,
  verifyMfa,
} from "~/lib/hris-auth";

export const Route = createFileRoute("/sign-in")({
  ssr: false,
  beforeLoad: () => {
    if (hasHrisSession()) {
      throw redirect({ to: "/" });
    }
  },
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginResult = async (
    result: Awaited<ReturnType<typeof loginWithPassword>>,
  ) => {
    if ("mfaRequired" in result) {
      setMfaToken(result.mfaToken);
      return;
    }
    await navigate({ to: "/" });
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

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setIsSubmitting(true);

    try {
      const idToken = await requestGoogleIdToken();
      const result = await loginWithGoogle(idToken);
      await handleLoginResult(result);
    } catch (error) {
      setAuthError(
        error instanceof HrisApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Google sign-in failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
      await navigate({ to: "/" });
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
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in to Tito Payroll
          </h1>
          <p className="text-sm text-muted-foreground">
            Use your HRIS account (same users as T201).
          </p>
        </header>

        {authError ? <Alert variant="error">{authError}</Alert> : null}

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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-label="Password"
                  required
                />
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
