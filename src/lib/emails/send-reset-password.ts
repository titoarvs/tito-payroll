import { sendMail } from "@/lib/mail";
import { resetPasswordEmail } from "@/lib/emails/templates";

export const sendResetPasswordEmail = async ({
  to,
  name,
  url,
}: {
  to: string;
  name: string;
  url: string;
}) => {
  const template = resetPasswordEmail({ name, url });
  return sendMail({ to, ...template });
};
