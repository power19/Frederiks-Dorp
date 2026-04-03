import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { sendMail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });

  // Make sure the SMTP password is current (not the masked placeholder)
  const passRow = await prisma.appSettings.findUnique({ where: { key: "smtp_pass" } });
  if (!passRow?.value) return NextResponse.json({ error: "SMTP password not set" }, { status: 400 });

  try {
    await sendMail({
      to,
      subject: "Test Email — PowerMentaL Network Inventory",
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;background:#f8fafc;border-radius:8px;">
          <h2 style="color:#1d4ed8;">✓ Email is working!</h2>
          <p style="color:#475569;">Your SMTP configuration is correct. You can now use email-based password resets.</p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send test email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
