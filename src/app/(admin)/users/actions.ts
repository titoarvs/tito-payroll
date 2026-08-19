"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { requireAdmin } from "@/lib/require-admin";

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "user"]),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const banUserSchema = z.object({
  userId: z.string().min(1),
  banReason: z.string().trim().max(500).optional(),
});

const userIdSchema = z.object({
  userId: z.string().min(1),
});

export const setUserRole = async (input: z.infer<typeof setRoleSchema>) => {
  await requireAdmin();
  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await auth.api.setRole({
      body: {
        userId: parsed.data.userId,
        role: parsed.data.role,
      },
      headers: await headers(),
    });

    try {
      await notify({
        userId: parsed.data.userId,
        type: "role_changed",
        title: "Role updated",
        body: `Your role is now ${parsed.data.role}.`,
        href: "/dashboard",
      });
    } catch (error) {
      console.error("[users] role notify failed", error);
    }

    revalidatePath("/users");
    revalidatePath(`/users/${parsed.data.userId}`);
    revalidatePath("/audit");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update role",
    };
  }
};

export const resetUserPassword = async (
  input: z.infer<typeof resetPasswordSchema>,
) => {
  await requireAdmin();
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await auth.api.setUserPassword({
      body: {
        userId: parsed.data.userId,
        newPassword: parsed.data.newPassword,
      },
      headers: await headers(),
    });
    revalidatePath("/users");
    revalidatePath(`/users/${parsed.data.userId}`);
    revalidatePath("/audit");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to reset password",
    };
  }
};

export const banUser = async (input: z.infer<typeof banUserSchema>) => {
  const session = await requireAdmin();
  const parsed = banUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (parsed.data.userId === session.user.id) {
    return { error: "You cannot ban yourself" };
  }

  try {
    await auth.api.banUser({
      body: {
        userId: parsed.data.userId,
        banReason: parsed.data.banReason || "Banned by admin",
      },
      headers: await headers(),
    });
    revalidatePath("/users");
    revalidatePath(`/users/${parsed.data.userId}`);
    revalidatePath("/audit");
    return { success: true as const };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to ban user",
    };
  }
};

export const unbanUser = async (input: z.infer<typeof userIdSchema>) => {
  await requireAdmin();
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await auth.api.unbanUser({
      body: { userId: parsed.data.userId },
      headers: await headers(),
    });
    revalidatePath("/users");
    revalidatePath(`/users/${parsed.data.userId}`);
    revalidatePath("/audit");
    return { success: true as const };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to unban user",
    };
  }
};
