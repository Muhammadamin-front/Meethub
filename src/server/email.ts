import "server-only";

import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM;

// Only enabled with a real key (placeholder "re_xxx" => disabled).
const enabled = !!API_KEY && !/^re_xxx/i.test(API_KEY) && !!FROM;
const resend = enabled ? new Resend(API_KEY) : null;

/** Best-effort transactional email; never throws to the caller. */
export async function sendEmail(
  to: string | null,
  subject: string,
  html: string,
) {
  if (!resend || !FROM || !to) return;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Email send failed (is RESEND_API_KEY configured?):", err);
  }
}
