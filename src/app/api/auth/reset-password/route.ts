import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  if (password.length < 8)  return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.used)
    return NextResponse.json({ error: "This reset link is invalid or has already been used." }, { status: 400 });

  if (record.expiresAt < new Date())
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
