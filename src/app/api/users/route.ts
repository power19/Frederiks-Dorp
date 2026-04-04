import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "reseller", "manager", "editor", "viewer"]).default("viewer"),
  customerId: z.string().optional().nullable(),
}).refine(d => ["admin", "reseller"].includes(d.role) || !!d.customerId, {
  message: "Customer is required for manager, editor and viewer roles",
  path: ["customerId"],
});

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "reseller")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // Resellers can only create manager/editor/viewer — not admin or other resellers
  if (role === "reseller" && ["admin", "reseller"].includes(parsed.data.role)) {
    return NextResponse.json({ error: "Resellers cannot create admin or reseller accounts" }, { status: 403 });
  }

  // Resellers can only create users for their own customers
  if (role === "reseller" && parsed.data.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { resellerId: true },
    });
    if (customer?.resellerId !== session.user.id) {
      return NextResponse.json({ error: "You can only create users for your own customers" }, { status: 403 });
    }
  }

  const plainPassword = generatePassword();
  const hashed = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.create({
    data: {
      name:       parsed.data.name,
      email:      parsed.data.email,
      password:   hashed,
      role:       parsed.data.role,
      customerId: ["admin", "reseller"].includes(parsed.data.role) ? null : (parsed.data.customerId ?? null),
    },
    select: { id: true, name: true, email: true, role: true, customerId: true, createdAt: true },
  });

  // Send welcome email (non-blocking — don't fail user creation if email fails)
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  let emailSent = false;
  try {
    await sendWelcomeEmail({
      to:       parsed.data.email,
      name:     parsed.data.name,
      email:    parsed.data.email,
      password: plainPassword,
      appUrl,
    });
    emailSent = true;
  } catch {
    // Email failure is non-fatal; password is returned in the response
  }

  return NextResponse.json({ ...user, plainPassword, emailSent }, { status: 201 });
}
