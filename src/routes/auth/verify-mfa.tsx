import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { HrisApiError } from "~/lib/hris-api-client";
import { verifyMfa } from "~/lib/hris-auth";

export const Route = createFileRoute("/auth/verify-mfa")({
  ssr: false,
  component: VerifyMfaPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mfaToken: typeof search.mfaToken === "string" ? search.mfaToken : undefined,
  }),
});

function VerifyMfaPage() {
  const { mfaToken } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!mfaToken) {
      setErrorMessage("Your MFA session is missing. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyMfa(mfaToken, code.trim());
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof HrisApiError
          ? error.message
          : "MFA verification failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Verify your identity
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the code from your authenticator app.
          </p>
        </header>

        {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="totp-code">Authentication code</Label>
            <Input
              id="totp-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              aria-label="MFA authentication code"
              required
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying…" : "Verify"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Return to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
