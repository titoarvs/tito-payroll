import Link from "next/link";

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const AuthShell = ({ title, description, children }: AuthShellProps) => {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-ink"
        >
          Next.js Boilerplate
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <div className="rounded-xl border border-border bg-white/90 p-8 shadow-[0_24px_60px_-36px_rgba(11,18,32,0.45)] animate-rise">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            auth
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
};
