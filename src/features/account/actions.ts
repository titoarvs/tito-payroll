"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/require-admin";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  image: z.string().url().nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfile = async (
  input: z.infer<typeof updateProfileSchema>,
) => {
  await requireSession();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await auth.api.updateUser({
      body: {
        name: parsed.data.name,
        ...(parsed.data.image !== undefined
          ? { image: parsed.data.image }
          : {}),
      },
      headers: await headers(),
    });
    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
};

export const changePassword = async (
  input: z.infer<typeof changePasswordSchema>,
) => {
  await requireSession();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
      headers: await headers(),
    });
    revalidatePath("/settings/password");
    return { success: true as const };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to change password",
    };
  }
};
