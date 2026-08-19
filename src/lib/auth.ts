import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { resolveAuditAction } from "@/lib/audit";
import { writeAuditLog } from "@/lib/audit-writer";
import { track } from "@/lib/analytics";
import { adminEmails, env, isGoogleAuthEnabled } from "@/lib/env";
import { welcomeEmail } from "@/lib/emails/templates";
import { sendResetPasswordEmail } from "@/lib/mail";
import { notify } from "@/lib/notify";

export const auth = betterAuth({
  appName: "Next.js Boilerplate",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        url,
      });
    },
  },
  socialProviders: isGoogleAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase();
          if (adminEmails.includes(email)) {
            return {
              data: {
                ...user,
                role: "admin",
              },
            };
          }
          return { data: user };
        },
        after: async (user) => {
          try {
            const template = welcomeEmail({ name: user.name });
            await notify({
              userId: user.id,
              type: "welcome",
              title: "Welcome",
              body: "Your account is ready.",
              href: "/dashboard",
              email: {
                to: user.email,
                ...template,
              },
            });
            await track({
              name: "signup",
              userId: user.id,
              props: { email: user.email },
            });
          } catch (error) {
            console.error("[auth] welcome notify failed", error);
          }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/admin/set-role") {
        return;
      }

      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const userId = typeof body.userId === "string" ? body.userId : null;
      if (!userId) {
        return;
      }

      try {
        const [target] = await db
          .select({
            email: schema.user.email,
            role: schema.user.role,
          })
          .from(schema.user)
          .where(eq(schema.user.id, userId))
          .limit(1);

        if (target) {
          // Stash pre-change role/email for the after hook.
          (ctx.context as Record<string, unknown>).auditTarget = target;
        }
      } catch {
        // ignore — after hook still logs without from/email
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const match = resolveAuditAction(ctx.path);
      if (!match) {
        return;
      }

      const session = ctx.context.session;
      const newSession = ctx.context.newSession;
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const auditTarget = (ctx.context as Record<string, unknown>)
        .auditTarget as { email?: string; role?: string | null } | undefined;

      const actor =
        session?.user ??
        newSession?.user ??
        (match.action === "login" ? newSession?.user : undefined);

      const targetUserId =
        typeof body.userId === "string" ? body.userId : undefined;
      let targetEmail = auditTarget?.email;
      let metadata: Record<string, unknown> | undefined;

      if (match.hasRoleChange && typeof body.role === "string") {
        metadata = {
          ...(auditTarget?.role ? { from: auditTarget.role } : {}),
          to: body.role,
        };
      }

      if (
        match.action === "password_reset_requested" &&
        typeof body.email === "string"
      ) {
        targetEmail = body.email;
      }

      if (match.hasTargetUser && targetUserId && !targetEmail) {
        try {
          const [target] = await db
            .select({ email: schema.user.email })
            .from(schema.user)
            .where(eq(schema.user.id, targetUserId))
            .limit(1);
          targetEmail = target?.email;
        } catch {
          // ignore
        }
      }

      const headers = ctx.headers;
      const ipAddress =
        headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headers?.get("x-real-ip") ??
        null;
      const userAgent = headers?.get("user-agent") ?? null;

      await writeAuditLog({
        action: match.action,
        actorId: actor?.id,
        actorEmail: actor?.email,
        targetUserId,
        targetEmail,
        metadata,
        ipAddress,
        userAgent,
      });

      if (match.action === "login" && actor?.id) {
        await track({
          name: "login",
          userId: actor.id,
          props: { path: ctx.path },
        });
      }
    }),
  },
  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
