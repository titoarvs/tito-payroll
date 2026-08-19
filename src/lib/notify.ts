import { db } from "@/db";
import { notification } from "@/db/schema/notification";
import { sendMail } from "@/lib/mail";

interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
  email?: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  };
}

export const notify = async (input: NotifyInput) => {
  await db.insert(notification).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? "",
    href: input.href ?? null,
  });

  if (input.email) {
    try {
      await sendMail(input.email);
    } catch (error) {
      console.error("[notify] email failed", error);
    }
  }
};
