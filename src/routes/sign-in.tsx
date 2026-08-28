import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
    <main className="auth-gradient-bg relative flex min-h-screen flex-col items-center justify-center p-6">
      <div aria-hidden className="noise-overlay" />
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <Card className="animate-auth-enter relative z-10 w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-mont text-2xl">Sign in to Tito Payroll</CardTitle>
          <CardDescription>
            Use your HRIS account (same users as T201).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <span className="relative z-10 bg-card px-2">or email</span>
                <div
                  className="absolute inset-x-0 top-1/2 border-t border-border"
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
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </main>
  );
}
