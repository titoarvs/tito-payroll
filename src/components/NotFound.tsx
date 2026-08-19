import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface NotFoundProps {
  children?: ReactNode;
}

export const NotFound = ({ children }: NotFoundProps) => {
  return (
    <div className="space-y-3 p-4">
      <div className="text-muted-foreground">
        {children ?? <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
          onClick={() => window.history.back()}
        >
          Go back
        </button>
        <Link
          to="/"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Home
        </Link>
      </p>
    </div>
  );
};
