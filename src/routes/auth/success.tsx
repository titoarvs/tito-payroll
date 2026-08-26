import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ModeToggle } from "~/components/mode-toggle";
import { Alert } from "~/components/ui/alert";
import {
  clearTokenPair,
  readTokenPair,
  storeTokenPair,
} from "~/lib/hris-api-client";
import { getCurrentHrisUser, parseTokensFromUrl } from "~/lib/hris-auth";

export const Route = createFileRoute("/auth/success")({
  ssr: false,
  component: AuthSuccessPage,
  validateSearch: (search: Record<string, unknown>) => ({
    accessToken:
      typeof search.accessToken === "string" ? search.accessToken : undefined,
    refreshToken:
      typeof search.refreshToken === "string" ? search.refreshToken : undefined,
  }),
});

const readTokensFromLocation = () =>
  typeof window === "undefined"
    ? {}
    : parseTokensFromUrl(window.location.search, window.location.hash);

function AuthSuccessPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    const completeSignIn = async () => {
      const fromLocation = readTokensFromLocation();
      const accessToken = fromLocation.accessToken || search.accessToken;
      const refreshToken = fromLocation.refreshToken || search.refreshToken;

      if (accessToken && refreshToken) {
        storeTokenPair({ accessToken, refreshToken });
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, document.title, "/auth/success");
        }
      }

      if (!readTokenPair()) {
        if (isActive) {
          setErrorMessage(
            "The sign-in response did not include valid credentials.",
          );
        }
        return;
      }

      try {
        await getCurrentHrisUser();
        if (isActive) {
          await navigate({ to: "/dashboard", replace: true });
        }
      } catch {
        clearTokenPair();
        if (isActive) {
          setErrorMessage(
            "We could not finish signing you in. Please try again.",
          );
        }
      }
    };

    void completeSignIn();
    return () => {
      isActive = false;
    };
  }, [navigate, search.accessToken, search.refreshToken]);

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        {errorMessage ? (
          <div className="space-y-3">
            <h1 className="text-xl font-semibold text-foreground">
              Sign-in failed
            </h1>
            <Alert variant="error">{errorMessage}</Alert>
            <a
              href="/sign-in"
              className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Return to sign in
            </a>
          </div>
        ) : (
          <div role="status" aria-live="polite" className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Finishing sign-in
            </h1>
            <p className="text-sm text-muted-foreground">
              Loading your HRIS profile…
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
