import { NextRequest, NextResponse } from "next/server";
import { getSessionScope } from "@/lib/sessionScope";
import { prisma } from "@/lib/prisma";

const ALLOWED_KEYS = [
  "smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from",
  "whatsapp_phone", "whatsapp_token", "whatsapp_webhook_secret",
];

export async function GET() {
  const scope = await getSessionScope();
  if (!scope?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.appSettings.findMany({ where: { key: { in: ALLOWED_KEYS } } });
  const config = Object.fromEntries(rows.map(r => [r.key, r.value]));
  // Never expose the raw SMTP password — send a masked placeholder
  if (config.smtp_pass) config.smtp_pass = "••••••••";
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const scope = await getSessionScope();
  if (!scope?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Record<string, string> = await req.json();

  const upserts = Object.entries(body)
    .filter(([key]) => ALLOWED_KEYS.includes(key))
    .filter(([, value]) => value !== "••••••••") // skip masked password placeholder
    .map(([key, value]) =>
      prisma.appSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

  await Promise.all(upserts);
  return NextResponse.json({ ok: true });
}
