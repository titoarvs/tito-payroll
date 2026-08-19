import Link from "next/link";

import { SiteHeaderNav } from "@/components/site-header-nav";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/require-admin";

const stack = [
  { name: "Next.js", detail: "16 · App Router" },
  { name: "Better Auth", detail: "SSO + email" },
  { name: "Drizzle", detail: "typed ORM" },
  { name: "Postgres", detail: "17 via Docker" },
];

const features = [
  {
    tag: "01",
    title: "Auth that actually ships",
    body: "Email/password and Google SSO through Better Auth. Password reset works with Resend, or logs the link to the console in local dev.",
  },
  {
    tag: "02",
    title: "Roles without a second service",
    body: "Admin plugin, ADMIN_EMAILS bootstrap, and a /users screen to change roles or reset passwords — all server-checked.",
  },
  {
    tag: "03",
    title: "Audit trail from one hook",
    body: "Logins, role changes, and password resets land in audit_log via a single Better Auth after-hook. No scattered logging.",
  },
  {
    tag: "04",
    title: "Lightweight by default",
    body: "Server Components and Server Actions — no React Query until you need polling, infinite scroll, or a shared client cache.",
  },
];

const steps = [
  {
    code: "01",
    title: "Clone & install",
    body: "pnpm install, copy .env.example → .env.local, generate a Better Auth secret.",
  },
  {
    code: "02",
    title: "Boot Postgres",
    body: "docker compose up -d, then pnpm db:migrate to apply the committed schema.",
  },
  {
    code: "03",
    title: "Ship your first admin",
    body: "Set ADMIN_EMAILS, pnpm dev, sign up with that email — /users and /audit unlock.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "admin";
  const isUser = Boolean(session) && !isAdmin;

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 animate-fade">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-ink"
          aria-label="Next.js Boilerplate home"
        >
          Next.js Boilerplate
        </Link>
        <SiteHeaderNav
          user={
            session
              ? { name: session.user.name, role: session.user.role }
              : null
          }
        />
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent animate-rise">
            boilerplate-nextjs-template
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl animate-rise [animation-delay:80ms]">
            Next.js Boilerplate
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground animate-rise [animation-delay:160ms]">
            Auth, roles, and an audit trail on Drizzle + Postgres — a starter
            built for developers who want to ship, not scaffold.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:240ms]">
            {!session ? (
              <>
                <Button asChild size="lg">
                  <Link href="/signup">Create an account</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign in with Google or email</Link>
                </Button>
              </>
            ) : null}

            {isAdmin ? (
              <>
                <Button asChild size="lg">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/admin">Admin overview</Link>
                </Button>
              </>
            ) : null}

            {isUser ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : null}
          </div>
          <ul className="mt-10 flex flex-wrap gap-2 animate-rise [animation-delay:320ms]">
            {stack.map((item) => (
              <li
                key={item.name}
                className="rounded-md border border-border bg-white/80 px-3 py-1.5 font-mono text-xs text-foreground"
              >
                <span className="text-ink">{item.name}</span>
                <span className="text-muted-foreground"> · {item.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="overflow-hidden rounded-xl border border-panel-line bg-panel text-panel-fg shadow-[0_30px_80px_-40px_rgba(0,194,168,0.55)] animate-rise [animation-delay:180ms]"
          aria-hidden
        >
          <div className="flex items-center gap-2 border-b border-panel-line px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[11px] text-panel-muted">
              src/lib/auth.ts
            </span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-6 sm:text-[13px]">
            <code>
              <span className="text-panel-muted">{"// Better Auth + admin plugin\n"}</span>
              <span className="text-accent">{"export const "}</span>
              <span className="text-white">{"auth = betterAuth({\n"}</span>
              <span className="text-panel-fg">{"  database: "}</span>
              <span className="text-white">{"drizzleAdapter(db, { provider: "}</span>
              <span className="text-accent">{'"pg"'}</span>
              <span className="text-white">{" }),\n"}</span>
              <span className="text-panel-fg">{"  emailAndPassword: { enabled: "}</span>
              <span className="text-accent">{"true"}</span>
              <span className="text-panel-fg">{" },\n"}</span>
              <span className="text-panel-fg">{"  socialProviders: { google: {...} },\n"}</span>
              <span className="text-panel-fg">{"  plugins: ["}</span>
              <span className="text-accent">{"admin()"}</span>
              <span className="text-panel-fg">{", "}</span>
              <span className="text-accent">{"nextCookies()"}</span>
              <span className="text-panel-fg">{"],\n"}</span>
              <span className="text-white">{"})"}</span>
              <span className="animate-pulse-line text-accent">{"█"}</span>
            </code>
          </pre>
        </div>
      </section>

      <section className="border-y border-border/80 bg-white/70">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.tag} className="space-y-3">
              <p className="font-mono text-xs text-accent">{feature.tag}</p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {feature.title}
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            routes
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            What you get out of the box
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A landing page, auth flows, an admin user table, and a filterable
            audit log — wired to Postgres with migrations ready to run.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/60 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["/", "Landing + stack overview", "Public"],
                ["/login · /signup", "Email auth + Google SSO", "Public"],
                ["/forgot-password", "Self-serve reset link", "Public"],
                ["/dashboard", "Signed-in home", "Session"],
                ["/settings/*", "Profile and password", "Session"],
                ["/users", "User list", "Admin"],
                ["/users/[id]", "Change role · reset password", "Admin"],
                ["/audit", "Filterable event history", "Admin"],
              ].map(([route, purpose, access]) => (
                <tr
                  key={route}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {route}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-border px-2 py-0.5 font-mono text-[11px]">
                      {access}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-border/80 bg-ink text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              quickstart
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              From zero to admin in three steps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Full setup, Google OAuth, and the production checklist live in the
              README.
            </p>
            {!session ? (
              <Button
                asChild
                className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/signup">Spin up an account</Link>
              </Button>
            ) : null}
            {isAdmin ? (
              <Button
                asChild
                className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href="/admin">Open admin overview</Link>
              </Button>
            ) : null}
          </div>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li
                key={step.code}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <p className="font-mono text-xs text-accent">{step.code}</p>
                <h3 className="mt-1 font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-white/65">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border/80 bg-white/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            boilerplate-nextjs-template · Better Auth · Drizzle · Postgres
          </p>
          <p className="text-xs text-muted-foreground">
            Google SSO appears on login/signup — configure env vars to activate.
          </p>
        </div>
      </footer>
    </main>
  );
}
