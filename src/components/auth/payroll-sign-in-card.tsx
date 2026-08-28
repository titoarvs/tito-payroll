import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import type { FormEvent } from "react";
import { TitoLogo } from "~/components/branding/TitoLogo";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

const GoogleMark = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface PayrollSignInCardProps {
  email: string;
  password: string;
  isPasswordVisible: boolean;
  mfaToken: string | null;
  mfaCode: string;
  authError: string;
  googleErrorMessage: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onMfaCodeChange: (value: string) => void;
  onLoginSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn: () => void;
  onMfaSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelMfa: () => void;
  className?: string;
}

export const PayrollSignInCard = ({
  email,
  password,
  isPasswordVisible,
  mfaToken,
  mfaCode,
  authError,
  googleErrorMessage,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onMfaCodeChange,
  onLoginSubmit,
  onGoogleSignIn,
  onMfaSubmit,
  onCancelMfa,
  className,
}: PayrollSignInCardProps) => (
  <div
    className={cn(
      "auth-card animate-auth-enter w-full max-w-xl",
      className,
    )}
  >
    <div className="border-b border-border/60 px-6 py-6 text-center sm:px-8">
      <div className="mb-5 flex justify-center">
        <TitoLogo size="default" />
      </div>
      <h1 className="font-mont text-2xl font-semibold tracking-tight text-foreground">
        {mfaToken ? "Verify your identity" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {mfaToken
          ? "Enter the authentication code from your authenticator app."
          : "Sign in with your HRIS account to access payroll."}
      </p>
    </div>

    <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
      {authError || googleErrorMessage ? (
        <Alert variant="error">{authError || googleErrorMessage}</Alert>
      ) : null}

      {mfaToken ? (
        <form className="space-y-5" onSubmit={onMfaSubmit}>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/50 text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Authentication code</Label>
            <Input
              id="mfa-code"
              name="mfa-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              value={mfaCode}
              onChange={(event) => onMfaCodeChange(event.target.value)}
              className="h-11 text-center tracking-[0.2em]"
              placeholder="000000"
              aria-label="MFA authentication code"
              required
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={onCancelMfa}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying…" : "Verify"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-3 border-border/80 bg-background text-sm font-medium shadow-sm"
            onClick={onGoogleSignIn}
            disabled={isSubmitting}
            aria-label="Continue with Google"
          >
            <GoogleMark />
            {isSubmitting ? "Redirecting…" : "Continue with Google"}
          </Button>

          <div className="relative py-1">
            <div
              className="absolute inset-x-0 top-1/2 border-t border-border/70"
              aria-hidden="true"
            />
            <p className="relative mx-auto w-fit bg-card px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              or continue with email
            </p>
          </div>

          <form className="space-y-4" onSubmit={onLoginSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  className="h-11 pl-10"
                  placeholder="you@company.com"
                  aria-label="Email address"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="h-11 pr-10 pl-10"
                  placeholder="Enter your password"
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
                  onClick={onTogglePasswordVisibility}
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
            <Button
              type="submit"
              className="h-11 w-full text-sm font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      )}
    </div>

    <p className="border-t border-border/60 px-6 py-4 text-center text-xs text-muted-foreground sm:px-8">
      Same account as T201 · Secured by Tito HRIS
    </p>
  </div>
);
