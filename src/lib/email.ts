import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const client = getResendClient();

  if (!client) {
    console.warn("RESEND_API_KEY não configurado. E-mail não enviado.", { to, subject });
    return { ok: false, skipped: true, reason: "RESEND_API_KEY não configurado." };
  }

  const result = await client.emails.send({
    from: process.env.LIBRARY_EMAIL_FROM || "Biblioteca <onboarding@resend.dev>",
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    return { ok: false, skipped: false, reason: result.error.message };
  }

  return { ok: true, skipped: false, id: result.data?.id };
}
