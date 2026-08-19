export const welcomeEmail = ({
  name,
}: {
  name: string;
}) => {
  const subject = "Welcome";
  const text = `Hi ${name},\n\nWelcome aboard. Open your dashboard to get started.`;
  const html = `
    <p>Hi ${name},</p>
    <p>Welcome aboard. Open your dashboard to get started.</p>
  `;
  return { subject, html, text };
};

export const orderReceiptEmail = ({
  name,
  orderId,
  totalLabel,
}: {
  name: string;
  orderId: string;
  totalLabel: string;
}) => {
  const subject = `Order confirmed · ${totalLabel}`;
  const text = `Hi ${name},\n\nYour order ${orderId} is paid (${totalLabel}).`;
  const html = `
    <p>Hi ${name},</p>
    <p>Your order <strong>${orderId}</strong> is paid (${totalLabel}).</p>
  `;
  return { subject, html, text };
};

export const resetPasswordEmail = ({
  name,
  url,
}: {
  name: string;
  url: string;
}) => {
  const subject = "Reset your password";
  const text = `Hi ${name},\n\nReset your password using this link:\n${url}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <p>Hi ${name},</p>
    <p>Reset your password using this link:</p>
    <p><a href="${url}">${url}</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  return { subject, html, text };
};
