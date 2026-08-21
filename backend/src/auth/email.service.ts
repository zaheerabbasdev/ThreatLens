import nodemailer from "nodemailer";
import { ServiceUnavailableError } from "../errors/AppError.js";
import { env } from "../config/env.js";

export async function sendPasswordResetCode(email: string, code: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw new ServiceUnavailableError("Password reset email is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "ThreatLens password reset code",
    text: `Your ThreatLens password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your ThreatLens password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}