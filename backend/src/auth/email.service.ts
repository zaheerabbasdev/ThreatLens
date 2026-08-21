import nodemailer from "nodemailer";
import { ServiceUnavailableError } from "../errors/AppError.js";
import { env } from "../config/env.js";

async function sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw new ServiceUnavailableError("Email delivery is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });

  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
}

export async function sendPasswordResetCode(email: string, code: string): Promise<void> {
  await sendMail(
    email,
    "ThreatLens password reset code",
    `Your ThreatLens password reset code is ${code}. It expires in 10 minutes.`,
    `<p>Your ThreatLens password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  );
}

export async function sendInvitation(email: string, name: string, role: string, token: string): Promise<void> {
  const link = `http://localhost:5173/accept-invite?token=${encodeURIComponent(token)}`;
  await sendMail(
    email,
    "You are invited to ThreatLens",
    `Hello ${name},\n\nYou have been invited to ThreatLens as ${role}. Set your password here: ${link}`,
    `<p>Hello ${name},</p><p>You have been invited to ThreatLens as <strong>${role}</strong>.</p><p><a href="${link}">Accept invitation</a></p>`,
  );
}