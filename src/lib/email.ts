import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

/** Load SMTP config from AppSettings. Returns null if not configured. */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const rows = await prisma.appSettings.findMany({
    where: { key: { in: ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"] } },
  });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));

  if (!map.smtp_host || !map.smtp_user || !map.smtp_pass) return null;

  return {
    host:   map.smtp_host,
    port:   parseInt(map.smtp_port ?? "587"),
    secure: map.smtp_secure === "true",
    user:   map.smtp_user,
    pass:   map.smtp_pass,
    from:   map.smtp_from || map.smtp_user,
  };
}

/** Send an email. Throws if SMTP is not configured or sending fails. */
export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const cfg = await getSmtpConfig();
  if (!cfg) throw new Error("Email is not configured. Ask your administrator to set up SMTP in Settings.");

  const transporter = nodemailer.createTransport({
    host:   cfg.host,
    port:   cfg.port,
    secure: cfg.secure,
    auth:   { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({ from: cfg.from, to, subject, html });
}

/** Send a password reset email. */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendMail({
    to,
    subject: "Password Reset — PowerMentaL",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#1d4ed8;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <h1 style="color:white;margin:0;font-size:18px;">PowerMentaL Network Inventory</h1>
        </div>
        <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;">
          You requested a password reset. Click the button below to set a new password.
          This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:20px 0;padding:12px 28px;background:#1d4ed8;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Reset Password
        </a>
        <p style="color:#94a3b8;font-size:12px;">
          If you didn't request this, ignore this email — your password won't change.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
        <p style="color:#cbd5e1;font-size:11px;">PowerMentaL Network Inventory</p>
      </div>
    `,
  });
}
