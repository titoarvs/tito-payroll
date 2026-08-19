import {
  ErrorComponent,
  Link,
  useRouter,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const DefaultCatchBoundary = ({ error }: ErrorComponentProps) => {
  const router = useRouter();

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
      <ErrorComponent error={error} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          onClick={() => {
            void router.invalidate();
          }}
        >
          Try again
        </button>
        <Link
          to="/"
          className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
        >
          Home
        </Link>
      </div>
    </div>
  );
};
