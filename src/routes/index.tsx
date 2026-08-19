import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Tito Payroll
      </h1>
      <p className="max-w-md text-center text-muted-foreground">
        Web client only. Auth and payroll data come from{" "}
        <code className="font-mono text-sm">tito-hris-api</code>. There is no
        local database.
      </p>
    </main>
  );
};
